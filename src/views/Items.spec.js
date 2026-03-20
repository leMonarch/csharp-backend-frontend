import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Items from './Items.vue'

describe('Items.vue', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('affiche le titre Items', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })
    const wrapper = mount(Items)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('h2').text()).toContain('Items')
  })

  it('affiche le formulaire d\'ajout', () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })
    const wrapper = mount(Items)
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('form input[placeholder="Nom"]').exists()).toBe(true)
    expect(wrapper.find('form button[type="submit"]').text()).toContain('Ajouter')
  })

  it('affiche le message vide quand la liste est vide', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })
    const wrapper = mount(Items)
    await vi.waitFor(() => wrapper.text().includes('Aucun item'), { timeout: 1000 })
  })

  it('affiche les items retournés par l\'API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'Item 1', description: 'Desc 1', createdAt: '2024-01-01' },
        { id: 2, name: 'Item 2', description: null, createdAt: '2024-01-02' },
      ]),
    })
    const wrapper = mount(Items)
    await vi.waitFor(() => wrapper.findAll('.item').length >= 2, { timeout: 1000 })
    expect(wrapper.text()).toContain('Item 1')
    expect(wrapper.text()).toContain('Item 2')
    expect(wrapper.text()).toContain('Desc 1')
  })

  it('affiche un message d\'erreur si l\'API échoue', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mount(Items)
    await vi.waitFor(() => wrapper.find('.error').exists(), { timeout: 1000 })
  })
})
