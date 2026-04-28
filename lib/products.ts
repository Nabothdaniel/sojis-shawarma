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
    image: '/images/beef-supreme.png'
  },
  {
    id: 'mutton-special',
    name: 'Mutton Special',
    price: 3500,
    category: 'Shawarma • Mutton',
    rating: '4.9',
    prepTime: '18 min prep',
    description: 'Premium mutton shawarma with tender meat, fresh vegetables, and special herb sauce. A Soji specialty!',
    image: '/images/beef-supreme.png'
  },
  {
    id: 'mix-combo',
    name: 'Mix Combo',
    price: 4000,
    category: 'Shawarma • Combo',
    rating: '5.0',
    prepTime: '20 min prep',
    description: 'The ultimate experience - beef, chicken, and mutton combined in one delicious wrap with all the trimmings.',
    image: '/images/beef-supreme.png'
  }
];

export const getProductById = (id: string) => products.find(p => p.id === id);
