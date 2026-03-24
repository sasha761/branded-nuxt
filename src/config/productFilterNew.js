export default {
  types: {
    brand: 'brand',
    size: 'size',
    orderby: 'orderby'
  },
  orderby: [
    {
      text: 'По новизне',
      key: 'date',
    },
    {
      text: 'Цены: по возрастанию',
      key: 'price-asc'
    },
    {
      text: 'Цены: по убыванию',
      key: 'price-desc'
    }
  ],
  brand: [
    {
      text: 'Bant Atelier',
      key: 'bant-atelier'
    },
    {
      text: 'BeOm Design',
      key: 'be-om'
    },
    {
      text: 'lexie',
      key: 'lexie'
    },
    {
      text: 'wearme',
      key: 'WearMe'
    }
  ],
  size: [
    {
      text: 'XS',
      key: 'xs'
    },
    {
      text: 'S',
      key: 's'
    },
    {
      text: 'M',
      key: 'm'
    },
    {
      text: 'L',
      key: 'l'
    },
    {
      text: 'XL',
      key: 'xl'
    }
  ],
  showAll: {
    text: 'Показать все',
    key: 'all'
  }
}