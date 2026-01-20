
export interface Product {
  id: number;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating?: number;
  categories: string[];
  tags: string[];
}

export interface Review {
  id: number;
  name: string;
  role: string;
  rating: number;
  text: string;
}

export interface Category {
  id: string;
  name: string;
  subCategories?: string[];
}
