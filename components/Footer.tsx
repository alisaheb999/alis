
import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';

const Footer: React.FC = () => {
  const { settings } = useApp();

  return (
    <footer className="bg-white border-t mt-12 pb-24 md:pb-12 pt-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div>
          <h3 className="text-xl font-bold mb-5 border-b-2 border-primary-yellow inline-block pb-1">Why Choose {settings.siteName}?</h3>
          <p className="text-gray-600 leading-relaxed mb-6">
            At {settings.siteName}, we bring you a handpicked collection of premium digital products — including software, eBooks, online courses, and creative assets.
          </p>
          <div className="flex space-x-4">
            <a href={settings.facebook} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-110 transition-transform"><i className="fab fa-facebook-f"></i></a>
            <a href={settings.youtube} className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 transition-transform"><i className="fab fa-youtube"></i></a>
            <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:scale-110 transition-transform"><i className="fab fa-whatsapp"></i></a>
          </div>
        </div>

        <div className="lg:pl-10">
          <h3 className="text-xl font-bold mb-5 border-b-2 border-primary-yellow inline-block pb-1">BEST SELLING</h3>
          <ul className="grid grid-cols-2 gap-y-2 text-gray-600">
            <li><Link to="/" className="hover:text-primary-yellow transition-colors">WordPress</Link></li>
            <li><Link to="/" className="hover:text-primary-yellow transition-colors">Web Script</Link></li>
            <li><Link to="/" className="hover:text-primary-yellow transition-colors">Course</Link></li>
            <li><Link to="/" className="hover:text-primary-yellow transition-colors">E-Book</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-5 border-b-2 border-primary-yellow inline-block pb-1">USEFUL LINKS</h3>
          <ul className="space-y-2 text-gray-600">
            <li><Link to="/" className="hover:text-primary-yellow transition-colors">About Us</Link></li>
            <li><Link to="/" className="hover:text-primary-yellow transition-colors">Contact Us</Link></li>
            <li><Link to="/" className="hover:text-primary-yellow transition-colors">Privacy Policy</Link></li>
            <li><Link to="/" className="hover:text-primary-yellow transition-colors">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 border-t pt-6">
        <p className="text-center text-gray-500 text-sm">
          {settings.footerText}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
