<script setup>
</script>

<template>
  <div class="home">
    <h2>Bienvenue</h2>
    <p>
      Projet initié avec <strong>C# (ASP.NET Core)</strong> en backend,
      <strong>Vue 3</strong> en frontend et <strong>MySQL</strong> en base de données.
    </p>
    <p>
      Utilisez le menu pour accéder à la page <router-link to="/items">Items</router-link>
      et tester l’API.
    </p>
  </div>
</template>

<style scoped>
.home {
  line-height: 1.7;
}
.home p {
  color: #94a3b8;
  margin: 0.75rem 0;
}
.home a {
  color: #38bdf8;
  text-decoration: none;
}
</style>
