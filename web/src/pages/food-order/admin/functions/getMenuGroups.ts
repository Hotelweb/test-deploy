import type { MenuItem } from '../../../../api'

export function getMenuGroups(items: MenuItem[]) {
  return {
    foodItems: items.filter((item) => item.category === 'food'),
    drinkItems: items.filter((item) => item.category === 'drink'),
    hiddenItems: items.filter((item) => !item.is_available).length,
  }
}
