<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Stack C# + Vue 3 + MySQL</h1>
      <nav>
        <router-link to="/">Accueil</router-link>
        <router-link to="/items">Items</router-link>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e8e8e8;
}
.header {
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}
.header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}
nav {
  display: flex;
  gap: 1.5rem;
}
nav a {
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
}
nav a.router-link-active {
  color: #38bdf8;
}
main {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}
</style>
