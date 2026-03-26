import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Home } from 'lucide-react';
import './sub-category.css';

const SubCategoryPage: React.FC = () => {
  const { id } = useParams();
  const [categoryName, setCategoryName] = useState('Category');
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [quickLinks, setQuickLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: products } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?category=${id}`);
        
        if (products.length > 0) {
          setCategoryName(products[0].category || 'Category');
        }

        // Subcategories
        const uniqueSubs = Array.from(new Set(products.map((p: any) => p.subCategory))).filter(Boolean);
        const subData = uniqueSubs.map(sub => {
          const subProducts = products.filter((p: any) => p.subCategory === sub);
          return {
            name: sub,
            image: subProducts[0]?.imageUrl || 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400',
          };
        });
        setSubCategories(subData);

        // Brands
        const uniqueBrands = Array.from(new Set(products.map((p: any) => p.brand))).filter(Boolean);
        setBrands(uniqueBrands);

        setQuickLinks([
          { name: 'Hinges', link: '/products?category=22&subCategory=Hinges' },
          { name: 'Channels', link: '/products?category=22&subCategory=Channels' },
          { name: 'Adhesives', link: '/products?category=22&subCategory=Adhesives' },
          { name: 'Laminate', link: '/category/03' },
          { name: 'Tools', link: '/products?category=tools' }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return (
    <div className="sub-category-page">
      <header className="sub-cat-header">
        <div className="header-nav">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2>{categoryName}</h2>
            <span>Material</span>
          </div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>

        {/* Similar Products (Shop by Category) Row */}
        <div className="quick-links-carousel">
          <div className="main-content-responsive ql-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0 }}>
            <span className="ql-label">Similar Products</span>
            <div className="ql-track">
              {quickLinks.map((item: any, idx) => (
                <Link key={idx} to={item.link} className="ql-item">{item.name}</Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="sub-cat-content main-content-responsive">
        {loading ? (
          <div className="loading-box">Finding best materials...</div>
        ) : (
          <>
            {/* Row 1: Sub Categories Horizontal Scroll */}
            <section className="sub-cat-row">
              <h3>Sub Categories</h3>
              <div className="horizontal-scroll-list">
                {subCategories.map((sub, idx) => (
                  <Link 
                    to={`/products?category=${id}&subCategory=${sub.name}`} 
                    key={idx} 
                    className="horizontal-item-card"
                  >
                    <div className="item-img-box">
                      <img src={sub.image} alt={sub.name} />
                    </div>
                    <span>{sub.name}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Row 2: Brands Horizontal Scroll */}
            <section className="brands-row">
              <h3>Shop by Brand</h3>
              <div className="horizontal-scroll-list">
                {brands.map((brand, idx) => (
                  <Link 
                    to={`/products?category=${id}&brand=${brand}`} 
                    key={idx} 
                    className="horizontal-item-card brand-card"
                  >
                    <div className="item-img-box brand-img-box">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(brand)}&background=f1f5f9&color=000&bold=true`} alt={brand} />
                    </div>
                    <span>{brand}</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default SubCategoryPage;
