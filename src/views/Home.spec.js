import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Home from './Home.vue'

function mountWithRouter(component) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component },
      { path: '/items', component: { template: '<div>Items</div>' }],
    ],
  })
  return mount(component, {
    global: {
      plugins: [router],
    },
  })
}

describe('Home.vue', () => {
  it('affiche le titre de bienvenue', () => {
    const wrapper = mountWithRouter(Home)
    expect(wrapper.find('h2').text()).toContain('Bienvenue')
  })

  it('mentionne C#, Vue 3 et MySQL', () => {
    const wrapper = mountWithRouter(Home)
    const text = wrapper.text()
    expect(text).toContain('C#')
    expect(text).toContain('Vue 3')
    expect(text).toContain('MySQL')
  })

  it('contient un lien vers la page Items', () => {
    const wrapper = mountWithRouter(Home)
    const link = wrapper.findComponent({ name: 'RouterLink' })
    expect(link.exists()).toBe(true)
    expect(link.attributes('to')).toBe('/items')
  })
})
