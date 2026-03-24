export const useCartStore = defineStore('cart', {
  state: () => ({
    products: [] as any[],
    totalAmount: 0,
  }),

  getters: {
    cartProducts(state): any[] {
      if (state.products.length) return state.products
      if (import.meta.client) {
        return JSON.parse(localStorage.getItem('cartProducts') || '[]')
      }
      return []
    },
  },

  actions: {
    setProductToCart(products: any[]) {
      this.products = products
      if (import.meta.client) {
        localStorage.setItem('cartProducts', JSON.stringify(products))
      }
    },

    setTotalAmount() {
      const products = this.cartProducts
      this.totalAmount = products.reduce(
        (acc: number, item: any) => acc + parseInt(item.price) * item.quantity,
        0
      )
    },
  },
})
