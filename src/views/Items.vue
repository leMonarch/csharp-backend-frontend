<script setup>
import { computed, ref, onMounted } from 'vue'

const API_ITEMS = '/api/items'
const API_CATEGORIES = '/api/categories'
const items = ref([])
const categories = ref([])
const loading = ref(false)
const error = ref('')
/** Priorités alignées sur l’API C# : 0=Basse, 1=Normale, 2=Haute */
const form = ref({ name: '', description: '', categoryId: '', dueDate: '', priority: '1' })
const newCategoryName = ref('')
const editingId = ref(null)
const filterCategoryId = ref('')
const filterStatus = ref('all')
const filterPriority = ref('')
/** Recherche en temps réel sur nom + description */
const searchQuery = ref('')
/** Tri appliqué après filtres : id | name | dueDate | createdAt */
const sortBy = ref('id')

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()

  return items.value.filter((item) => {
    const byCategory =
      filterCategoryId.value === '' || item.categoryId === Number(filterCategoryId.value)

    const byStatus =
      filterStatus.value === 'all' ||
      (filterStatus.value === 'todo' && item.isDone === false) ||
      (filterStatus.value === 'done' && item.isDone === true)

    const pr = normalizePriority(item.priority)
    const byPriority = filterPriority.value === '' || String(pr) === filterPriority.value

    const name = (item.name ?? '').toLowerCase()
    const desc = (item.description ?? '').toLowerCase()
    const bySearch = !q || name.includes(q) || desc.includes(q)

    return byCategory && byStatus && byPriority && bySearch
  })
})

const sortedFilteredItems = computed(() => {
  const list = [...filteredItems.value]
  list.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return (a.name ?? '').localeCompare(b.name ?? '', 'fr', { sensitivity: 'base' })
      case 'dueDate': {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY
        if (da === Number.POSITIVE_INFINITY && db === Number.POSITIVE_INFINITY) return a.id - b.id
        if (da === Number.POSITIVE_INFINITY) return 1
        if (db === Number.POSITIVE_INFINITY) return -1
        return da - db
      }
      case 'createdAt': {
        const ca = new Date(a.createdAt).getTime()
        const cb = new Date(b.createdAt).getTime()
        return cb - ca
      }
      case 'priority': {
        const pa = normalizePriority(a.priority)
        const pb = normalizePriority(b.priority)
        if (pb !== pa) return pb - pa
        return a.id - b.id
      }
      default:
        return a.id - b.id
    }
  })
  return list
})

async function fetchCategories() {
  try {
    const res = await fetch(API_CATEGORIES)
    if (!res.ok) throw new Error('Erreur catégories')
    categories.value = await res.json()
  } catch {
    categories.value = []
  }
}

async function fetchItems() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(API_ITEMS)
    if (!res.ok) throw new Error('Erreur API')
    items.value = await res.json()
  } catch (e) {
    error.value = 'Impossible de joindre l’API. Vérifiez que le backend C# tourne sur http://localhost:5000'
  } finally {
    loading.value = false
  }
}

async function createCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return
  try {
    const res = await fetch(API_CATEGORIES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Erreur création catégorie')
    }
    newCategoryName.value = ''
    await fetchCategories()
  } catch (e) {
    error.value = e.message
  }
}

async function create() {
  if (!form.value.name.trim()) return
  const categoryId = form.value.categoryId === '' ? null : Number(form.value.categoryId)
  try {
    const res = await fetch(API_ITEMS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.value.name,
        description: form.value.description || null,
        isDone: false,
        categoryId,
        dueDate: dueDateFromPicker(form.value.dueDate),
        priority: Number(form.value.priority),
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Erreur création (${res.status}): ${text || res.statusText}`)
    }
    form.value = { name: '', description: '', categoryId: form.value.categoryId, dueDate: '', priority: '1' }
    await fetchItems()
  } catch (e) {
    error.value = e.message
  }
}

async function update(item) {
  try {
    const payload = {
      id: item.id,
      name: item.name,
      description: item.description,
      isDone: item.isDone,
      categoryId: item.categoryId ?? null,
      dueDate: item.dueDate ?? null,
      priority: normalizePriority(item.priority),
    }
    const res = await fetch(`${API_ITEMS}/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Erreur mise à jour')
    editingId.value = null
    await fetchItems()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(id) {
  if (!confirm('Supprimer cet item ?')) return
  try {
    const res = await fetch(`${API_ITEMS}/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erreur suppression')
    await fetchItems()
  } catch (e) {
    error.value = e.message
  }
}

function toggleDone(item) {
  item.isDone = !item.isDone
  update(item)
}

function categoryLabel(item) {
  return item.category?.name ?? ''
}

/** 0 / 1 / 2 selon l’enum serveur ; défaut normale si absent */
function normalizePriority(p) {
  const n = Number(p)
  if (n === 0 || n === 1 || n === 2) return n
  return 1
}

function priorityLabel(p) {
  switch (normalizePriority(p)) {
    case 0:
      return 'Basse'
    case 2:
      return 'Haute'
    default:
      return 'Normale'
  }
}

function priorityBadgeClass(p) {
  switch (normalizePriority(p)) {
    case 0:
      return 'prio-low'
    case 2:
      return 'prio-high'
    default:
      return 'prio-normal'
  }
}

/** Chaîne yyyy-MM-dd pour <input type="date"> */
function dueDateInputValue(iso) {
  if (!iso) return ''
  return String(iso).slice(0, 10)
}

/** Envoie une date à minuit UTC pour cohérence avec l’API */
function dueDateFromPicker(value) {
  if (!value) return null
  return `${value}T00:00:00.000Z`
}

function formatDueDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Item non terminé et échéance avant aujourd’hui (date locale) */
function isOverdue(item) {
  if (item.isDone || !item.dueDate) return false
  const d = new Date(item.dueDate)
  const today = new Date()
  const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return dueDay < todayDay
}

onMounted(async () => {
  await fetchCategories()
  await fetchItems()
})
</script>

<template>
  <div class="items">
    <h2>Items (API C# + MySQL)</h2>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="form filters-row">
      <input
        v-model="searchQuery"
        type="search"
        class="search-input"
        placeholder="Rechercher (nom ou description)…"
        autocomplete="off"
        aria-label="Rechercher dans les items"
      />
      <select v-model="filterCategoryId" class="select">
        <option value="">Toutes les catégories</option>
        <option v-for="c in categories" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
      </select>
      <select v-model="filterStatus" class="select">
        <option value="all">Tous</option>
        <option value="todo">À faire</option>
        <option value="done">Terminés</option>
      </select>
      <select v-model="filterPriority" class="select" aria-label="Filtrer par priorité">
        <option value="">Toutes priorités</option>
        <option value="2">Haute</option>
        <option value="1">Normale</option>
        <option value="0">Basse</option>
      </select>
      <select v-model="sortBy" class="select" aria-label="Trier la liste">
        <option value="id">Trier : ordre (id)</option>
        <option value="name">Trier : nom (A→Z)</option>
        <option value="dueDate">Trier : échéance (proche d’abord)</option>
        <option value="createdAt">Trier : création (récent d’abord)</option>
        <option value="priority">Trier : priorité (haute d’abord)</option>
      </select>
    </div>
    <div class="category-box">
      <h3 class="sub">Nouvelle catégorie</h3>
      <div class="form">
        <input v-model="newCategoryName" placeholder="Nom de la catégorie" />
        <button type="button" @click="createCategory">Créer la catégorie</button>
      </div>
    </div>

    <form @submit.prevent="create" class="form">
      <input v-model="form.name" placeholder="Nom" required />
      <input v-model="form.description" placeholder="Description (optionnel)" />
      <select v-model="form.categoryId" class="select">
        <option value="">— Sans catégorie —</option>
        <option v-for="c in categories" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
      </select>
      <input v-model="form.dueDate" type="date" class="select" title="Échéance (optionnel)" />
      <select v-model="form.priority" class="select" title="Priorité">
        <option value="0">Priorité : basse</option>
        <option value="1">Priorité : normale</option>
        <option value="2">Priorité : haute</option>
      </select>
      <button type="submit">Ajouter</button>
    </form>

    <div v-if="loading" class="loading">Chargement…</div>
    <ul v-else class="list">
      <li v-for="item in sortedFilteredItems" :key="item.id" class="item" :class="{ overdue: isOverdue(item) }">
        <template v-if="editingId === item.id">
          <input v-model="item.name" />
          <input v-model="item.description" placeholder="Description" />
          <select
            class="select"
            :value="item.categoryId ?? ''"
            @change="item.categoryId = $event.target.value === '' ? null : Number($event.target.value)"
          >
            <option value="">— Sans catégorie —</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <input
            type="date"
            class="select"
            :value="dueDateInputValue(item.dueDate)"
            @change="item.dueDate = dueDateFromPicker($event.target.value)"
          />
          <select
            class="select"
            :value="normalizePriority(item.priority)"
            title="Priorité"
            @change="item.priority = Number($event.target.value)"
          >
            <option :value="0">Basse</option>
            <option :value="1">Normale</option>
            <option :value="2">Haute</option>
          </select>
          <button @click="update(item)">Enregistrer</button>
          <button type="button" @click="editingId = null">Annuler</button>
        </template>
        <template v-else>
          <input
            type="checkbox"
            :checked="item.isDone"
            @change="toggleDone(item)"
            title="Terminé"
          />
          <span class="prio" :class="priorityBadgeClass(item.priority)">{{ priorityLabel(item.priority) }}</span>
          <span v-if="categoryLabel(item)" class="cat">{{ categoryLabel(item) }}</span>
          <span class="name" :class="{ done: item.isDone }">{{ item.name }}</span>
          <span v-if="item.description" class="desc" :class="{ done: item.isDone }">{{ item.description }}</span>
          <span v-if="item.dueDate" class="due" :class="{ done: item.isDone, overdue: isOverdue(item) }">
            Échéance : {{ formatDueDate(item.dueDate) }}
          </span>
          <button @click="editingId = item.id">Modifier</button>
          <button type="button" class="danger" @click="remove(item.id)">Supprimer</button>
        </template>
      </li>
    </ul>
    <p v-if="!loading && items.length === 0" class="empty">Aucun item. Créez-en un ci-dessus.</p>
    <p v-else-if="!loading && filteredItems.length === 0" class="empty">
      Aucun résultat pour la recherche et les filtres sélectionnés.
    </p>
  </div>
</template>

<style scoped>
.item .name.done,
.item .desc.done {
  text-decoration: line-through;
  opacity: 0.85;
  color: #94a3b8;
}
.items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.sub {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #94a3b8;
}
.category-box {
  padding: 1rem;
  background: rgba(255,255,255,0.04);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
}
.error {
  color: #f87171;
  padding: 0.5rem;
  background: rgba(248,113,113,0.1);
  border-radius: 6px;
}
.form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
.filters-row {
  align-items: stretch;
}
.search-input {
  flex: 1 1 220px;
  min-width: 200px;
  max-width: 100%;
}
.form input,
.select {
  padding: 0.5rem;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  background: rgba(0,0,0,0.2);
  color: #e8e8e8;
  min-width: 140px;
}
.select {
  min-width: 180px;
}
.form button {
  padding: 0.5rem 1rem;
  background: #38bdf8;
  color: #0f172a;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.loading { color: #94a3b8; }
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.item .prio {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  flex-shrink: 0;
}
.item .prio.prio-low {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.2);
}
.item .prio.prio-normal {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
}
.item .prio.prio-high {
  color: #fb923c;
  background: rgba(251, 146, 60, 0.2);
}
.item .cat {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #a78bfa;
  background: rgba(167,139,250,0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
.item .name { font-weight: 500; min-width: 120px; }
.item .desc { color: #94a3b8; font-size: 0.9rem; }
.item .due {
  font-size: 0.85rem;
  color: #94a3b8;
}
.item .due.overdue:not(.done) {
  color: #f87171;
  font-weight: 600;
}
.item.overdue {
  border: 1px solid rgba(248, 113, 113, 0.35);
}
.item button {
  padding: 0.35rem 0.75rem;
  background: rgba(255,255,255,0.1);
  color: #e8e8e8;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.item button.danger { color: #f87171; border-color: rgba(248,113,113,0.4); }
.empty { color: #64748b; }
</style>
