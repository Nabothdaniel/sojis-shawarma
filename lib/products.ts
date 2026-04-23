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
    price: 2800,
    category: 'Shawarma • Beef',
    rating: '4.8',
    prepTime: '15 min prep',
    description: 'Loaded with seasoned beef, fresh veggies, garlic sauce, and wrapped in a warm toasted bread. Satisfying every time.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpoZCAMGtmgEG5_w5Da6qqD9OBKOQZOLFtmfZneDwFv3qEu4RKfjWnTPysBzDNjq5qLKesCRolXAWee2bH2Ddxxz9TvrnYTVGK0p7tm2h36J74sn2MxoeXU5Jg3ZfHNkUl56-9mnfe71c9S5F6CGPKvM3RAaNPPF12bFFIzVRN4aNMB0jeIoSnp0_pfKbHvlzQTbzP_RsGKe6Nlxj2IBc3jxIS-adgusVALfFBgEZ4XX_XXb7ZO5JKkKnAQ8uP4suLASSwV8ODFr22'
  },
  {
    id: '2',
    name: 'Mega Beef Shawarma',
    price: 3200,
    category: 'Shawarma • Beef',
    rating: '4.9',
    prepTime: '20 min prep',
    description: 'The ultimate shawarma experience. Double beef, extra cabbage, and our secret spicy sauce.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgF4Ul2WsXqpYSKu7D7Ez2uRRqpVY1vjH_JWvoDUQzpevPNuBCqzis1aTYmu30mBnAcaRHVCpBEy4y5C1Z2DHY0NjUtVA4SMsKZsXPHxJEhD89rLqSJkWS4L4cEzpM3csls6L2DIzB5EVPu5plxEivl3t3Q75_nVUQHEtd43RHdY68JEydAwsLNieZJl3Rx4Mwvb1hxEly6Zo7X7mS51jAbqf8_Zguj2YYdl3uF24DZfZIChwMOklDKmnBcoVE-VneVnS6XkLGk9NK'
  },
  {
    id: 'chicken-shawarma',
    name: 'Classic Chicken',
    price: 2500,
    category: 'Shawarma • Chicken',
    rating: '4.7',
    prepTime: '12 min prep',
    description: 'Tender grilled chicken strips with fresh lettuce, tomatoes, and creamy tahini sauce.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXyaAV2L0BhLyfFTp-Cg8u3Q2LWWe4F9qx3RLK3legiMxlJFYbdAEWsJEWo29rGFjOIbWxfqEE3D61ami3zzDBZMtbFrLqc4wO6ydsMm7s96hMiz60I1yiywqPquyndbbCv4pGPd3MihJf1QM9eEih8e9mJmw1ltQS99YKdZOysHO4iAeQEKonNe6hjj7U6psaWy92v4OjveQe0A4GzsDi2UBLY80tbeRDdZQJfL6fIf-bY2FG3Kbag_I4Zk5HlrhV2Z9x_z-0adJP'
  }
];

export const getProductById = (id: string) => products.find(p => p.id === id);
