export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: string;
  description: string;
  prepTime: string;
  image: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Beef Supreme',
    price: 3200,
    category: 'Shawarma • Beef',
    rating: '4.9',
    prepTime: '15 min prep',
    description: 'Loaded with tender seasoned beef slices, fresh cabbage, onions, garlic sauce, and pickles. Toasted flatbread with slight grill marks.',
    image: '/images/beef-supreme.png'
  },
  {
    id: 'chicken-shawarma',
    name: 'Classic Chicken',
    price: 2500,
    category: 'Shawarma • Chicken',
    rating: '4.8',
    prepTime: '12 min prep',
    description: 'Juicy grilled chicken, fresh lettuce, tomatoes, and creamy tahini sauce wrapped in a warm toasted bread.',
    image: '/images/chicken-classic.png'
  }
];

export const getProductById = (id: string) => products.find(p => p.id === id);
