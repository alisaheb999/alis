
import React from 'react';
import { Product, Review, Category } from './types';

export const COLORS = {
  primary: '#FFC000',
  text: '#222222',
  background: '#f7f8f9',
};

const DEMO_IMAGE = 'https://zoravex.com/wp-content/uploads/2025/06/%F0%9F%94%A5-CapCut-Pro-Method-%E2%80%93-%E0%A6%AE%E0%A6%BE%E0%A6%A4%E0%A7%8D%E0%A6%B0-%E0%A7%AF%E0%A7%AF-%E0%A6%9F%E0%A6%BE%E0%A6%95%E0%A6%BE%E0%A6%AF%E0%A6%BC-%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A7%8B-%E0%A6%AB%E0%A6%BF%E0%A6%9A%E0%A6%BE%E0%A6%B0-%E0%A6%86%E0%A6%A8%E0%A6%B2%E0%A6%95-%E0%A6%95%E0%A6%B0%E0%A7%81%E0%A6%A8-768x768.png';

export const NAVIGATION_CATEGORIES: Category[] = [
  { id: 'home', name: 'Home' },
  { 
    id: 'wordpress', 
    name: 'WordPress', 
    subCategories: ['Full Website', 'Theme', 'Template', 'Landing Pages', 'Plugin'] 
  },
  { 
    id: 'web-script', 
    name: 'Web Script', 
    subCategories: ['Laravel Script', 'HTML Website'] 
  },
  { 
    id: 'apps-software', 
    name: 'Apps And Software', 
    subCategories: ['Pc Software', 'Mobile Apps'] 
  },
  { 
    id: 'mega-file', 
    name: 'Mega File', 
    subCategories: ['Editing Bundle', 'Graphics Bundle', 'Reels Bundle'] 
  },
  { id: 'course', name: 'Course' },
  { 
    id: 'others', 
    name: 'Others', 
    subCategories: ['Subscription', 'Tools', 'Windows', 'E-Book', 'Ai Prompts', 'Business Tools'] 
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    title: 'মাত্র ৩০০ টাকায় নিজের ফেসবুক প্রোফাইলে Blue Verification Badge পাওয়ার কৌশল!',
    price: 300,
    oldPrice: 650,
    image: DEMO_IMAGE,
    categories: ['Course'],
    tags: ['facebook', 'badge']
  },
  {
    id: 2,
    title: 'ডিজিটাল প্রোডাক্ট ওয়েবসাইট প্যাকেজ – সম্পূর্ণ ব্যবসা সেটআপ মাত্র ২১,০০০৳',
    price: 21000,
    oldPrice: 50000,
    image: DEMO_IMAGE,
    categories: ['Full Website'],
    tags: ['business', 'website']
  },
  {
    id: 3,
    title: '২ লক্ষ কপিরাইট ফ্রি রিল + ফ্রি ফেসবুক মনিটাইজেশন কোর্স – ভাইরাল ইনকাম প্যাকেজ!',
    price: 149,
    oldPrice: 650,
    image: DEMO_IMAGE,
    categories: ['Reels Bundle'],
    tags: ['reels', 'income']
  },
  {
    id: 4,
    title: 'YouTube Premium Method – সাবস্ক্রিপশন ছাড়াই প্রিমিয়াম ফিচার ব্যবহার করুন!',
    price: 199,
    oldPrice: 799,
    image: DEMO_IMAGE,
    categories: ['Course'],
    tags: ['youtube', 'premium']
  },
  {
    id: 5,
    title: 'CapCut Pro Method – মাত্র 200 টাকায় প্রো ফিচার আনলক করুন!',
    price: 200,
    oldPrice: 599,
    image: DEMO_IMAGE,
    categories: ['Course'],
    tags: ['capcut', 'editing']
  },
  {
    id: 6,
    title: 'Virtual Visa Card Create Method – নিজেই তৈরি করুন কার্ড মাত্র ১৯৯ টাকায়',
    price: 199,
    oldPrice: 599,
    image: DEMO_IMAGE,
    categories: ['Tools'],
    tags: ['visa', 'payment']
  }
];

export const REVIEWS: Review[] = [
  {
    id: 1,
    name: 'Sorif Khan',
    role: 'Small Business Owner',
    rating: 5,
    text: 'Market Guru is a game-changer for my business. Their custom WordPress solutions helped me create a professional online presence.'
  },
  {
    id: 2,
    name: 'Shakil Islam',
    role: 'Blogger & Content Creator',
    rating: 5,
    text: "I've been using Market Guru themes for years, and they never disappoint. Their themes are visually stunning and highly responsive."
  },
  {
    id: 3,
    name: 'Abu Sayeed',
    role: 'Tech Enthusiast',
    rating: 5,
    text: "I appreciate the commitment to authenticity. Knowing that I'm getting original licenses for plugins gives me peace of mind."
  }
];
