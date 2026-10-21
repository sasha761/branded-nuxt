import type { ProductShort } from '~/types/wp-api'

/**
 * GA4-события в dataLayer (GTM), в том же формате, что слала тема WP
 * (news/src/js/modules/google-ads.js), чтобы теги и отчёты продолжили работать.
 */
type Item = Record<string, string | number>

interface ListContext {
  listName?: string
  listId?: string | number
  categories?: string[]
}

function categoryFields(categories: string[] = []) {
  const fields: Item = {}

  categories.filter(Boolean).forEach((category, index) => {
    fields[index === 0 ? 'item_category' : `item_category${index + 1}`] = category.trim()
  })

  return fields
}

function pushEcommerce(event: string, ecommerce: Record<string, unknown>) {
  if (import.meta.server) {
    return
  }

  const w = window as any
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ ecommerce: null })
  w.dataLayer.push({ event, ecommerce })
}

function productItem(product: Partial<ProductShort> & Record<string, any>, extra: Item = {}): Item {
  return {
    item_name: product.name || '',
    item_id: product.id ?? '',
    price: product.price ?? '',
    item_brand: product.post_attr_brand || product.specs?.brand || '',
    quantity: 1,
    ...categoryFields(product.specs?.categories || product.categories || []),
    ...extra,
  }
}

export function useAnalytics() {
  return {
    viewItem(product: Record<string, any>) {
      pushEcommerce('view_item', { items: [productItem(product)] })
    },

    addToCart(product: Record<string, any>, quantity = 1) {
      pushEcommerce('add_to_cart', { items: [productItem(product, { quantity })] })
    },

    viewItemList(products: ProductShort[], context: ListContext = {}) {
      if (!products.length) {
        return
      }

      pushEcommerce('view_item_list', {
        items: products.map((product, index) => ({
          ...productItem(product),
          ...categoryFields(context.categories),
          item_list_name: context.listName || 'Product category',
          item_list_id: context.listId ?? '',
          index: index + 1,
        })),
      })
    },

    selectItem(product: ProductShort, index: number, context: ListContext = {}) {
      pushEcommerce('select_item', {
        items: [{
          ...productItem(product),
          ...categoryFields(context.categories),
          item_list_name: context.listName || 'Product category',
          item_list_id: context.listId ?? '',
          index: index + 1,
        }],
      })
    },

    purchase(order: Record<string, any>, products: Record<string, any>[]) {
      const transactionId = String(order.order_number || order.order_id || '')

      pushEcommerce('purchase', {
        transaction_id: transactionId,
        value: order.order_total,
        currency: 'UAH',
        items: products.map((product, index) => ({
          item_name: product.name,
          item_id: product.id,
          price: product.total,
          item_brand: product.brand?.[0]?.name || '',
          item_list_name: 'Purchase order list',
          item_list_id: transactionId,
          index: index + 1,
          quantity: product.qty,
          ...categoryFields(product.cats || []),
        })),
      })
    },

    viewSearchResults(products: ProductShort[]) {
      if (import.meta.server || !products.length) {
        return
      }

      const w = window as any
      w.dataLayer = w.dataLayer || []
      w.dataLayer.push({
        event: 'view_search_results',
        items: products.map(product => ({ id: product.id, google_business_vertical: 'retail' })),
      })
    },
  }
}
