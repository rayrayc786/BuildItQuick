import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  Filter,
  ArrowUpDown,
  X,
  MessageCircle
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

import SEO from '../components/SEO';
import { getFullImageUrl } from '../utils/imageUrl';
import './product-list.css';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const resultsAreaRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<string>('default'); // 'price-low', 'price-high'
  const [showFilters, setShowFilters] = useState(false);
  
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [modalSubCats, setModalSubCats] = useState<any[]>([]);
  const [activeModalCat, setActiveModalCat] = useState<string | null>(null);
  const [allBrands, setAllBrands] = useState<any[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const subCategoryName = params.get('subCategory');
  const categoryId = params.get('category');
  const initialBrand = params.get('brand');
  const searchTerm = params.get('search');




  // Parallel fetch for static metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/categories`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/brands`)
        ]);
        setAllCategories(catsRes.data);
        setAllBrands(brandsRes.data);
        if (categoryId) setActiveModalCat(categoryId);
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };
    fetchMetadata();
  }, [categoryId]);

  useEffect(() => {
    if (initialBrand) {
      setSelectedBrand(initialBrand);
    }
  }, [initialBrand]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset products when filters change
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [location.search, selectedBrand, sortBy]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!hasMore && page > 1) return;
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        params.set('page', page.toString());
        params.set('limit', '20');
        if (sortBy !== 'default') params.set('sort', sortBy);
        if (selectedBrand) params.set('brand', selectedBrand);

        const searchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/products?${params.toString()}`;
        const { data, headers } = await axios.get(searchUrl);
        
        setProducts(prev => page === 1 ? data : [...prev, ...data]);
        
        const totalCount = parseInt(headers['x-total-count'] || '0');
        if (products.length + data.length >= totalCount || data.length < 20) {
          setHasMore(false);
        }

        // Reporting missing products (only on first page search)
        if (searchTerm && page === 1 && data.length === 0) {
           const userStr = localStorage.getItem('user');
           let userData = { searchTerm, userName: 'Guest', userId: null, userPhone: '', userEmail: '' };
           if (userStr) {
             const user = JSON.parse(userStr);
             userData = { ...userData, userName: user.fullName || 'User', userId: user._id || null };
           }
           axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/user-requests/report-missing-product`, userData).catch(() => {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, location.search, selectedBrand, sortBy]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 1.0 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  // Scroll results area back to top when brand changes
  useEffect(() => {
    if (resultsAreaRef.current) {
      resultsAreaRef.current.scrollTo(0, 0);
    }
  }, [selectedBrand]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!categoryId) {
        setSimilarProducts([]);
        return;
      }
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/sub-categories?categoryId=${categoryId}`);
        const list = data.map((sc: any) => ({
          name: sc.name,
          link: `/products?category=${categoryId}&subCategory=${sc.name}`
        }));
        setSimilarProducts(list);
      } catch (err) {
        console.error('Failed to fetch similar subcategories:', err);
      }
    };
    fetchSubCategories();
  }, [categoryId]);

  // Ensure an active category is selected when the modal opens
  useEffect(() => {
    if (showFilters && !activeModalCat && allCategories.length > 0) {
      setActiveModalCat(allCategories[0].name || allCategories[0]._id);
    }
  }, [showFilters, allCategories, activeModalCat]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFilters]);

  const activeCatObject = useMemo(() => {
    return allCategories.find(c => c.name === activeModalCat || c._id === activeModalCat);
  }, [allCategories, activeModalCat]);

  useEffect(() => {
    const fetchModalSubCats = async () => {
      const targetId = activeCatObject?._id || activeModalCat;
      
      if (!targetId) return;
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/sub-categories?categoryId=${encodeURIComponent(targetId)}`);
        setModalSubCats(data);
      } catch (err) { console.error(err); }
    };
    if (showFilters) fetchModalSubCats();
  }, [activeModalCat, showFilters, activeCatObject]);

  const brands = useMemo(() => {
    // If brand selection is active, we still want to show all available brands for the category/search
    // For now, we'll keep it simple and show brands from allBrands that are relevant or just use distinct brands if we had them.
    // Optimal: get distinct brands from backend for the current query.
    return allBrands.map(b => b.name).sort();
  }, [allBrands]);

  // Products are now filtered on the server side
  const filteredProducts = products;

  const handleClearFilters = () => {
    setSelectedBrand(null);
    setSortBy('default');
    navigate('/products');
  };

  const isFiltered = useMemo(() => {
    return !!(categoryId || subCategoryName || searchTerm || selectedBrand);
  }, [categoryId, subCategoryName, searchTerm, selectedBrand]);

  const currentCategoryMetadata = useMemo(() => {
    if (!categoryId) return null;
    return allCategories.find(c => c.name === categoryId || c._id === categoryId);
  }, [allCategories, categoryId]);

  return (
    <div className="matall-list-page">
      <SEO 
        title={subCategoryName || categoryId || 'Products'}
        description={`Explore our collection of ${subCategoryName || categoryId || 'products'} on MatAll. Quality supplies delivered fast.`}
      />
      <header className="list-header-sticky">
        <div className="header-nav main-content-responsive">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2 className="buy-online-text">
              {searchTerm ? `Results for "${searchTerm}"` : `Buy ${subCategoryName || 'Products'} online`}
            </h2>
          </div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>

        {subCategoryName && similarProducts.length > 0 && (
          <div className="quick-links-carousel">
            <div className="main-content-responsive ql-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0 }}>
              <span className="ql-label">Similar Products</span>
              <div className="ql-track">
                {similarProducts.map((item, idx) => {
                  const isActive = item.name === subCategoryName;
                  // If active, clicking again removes the subCategory filter
                  const toggleLink = isActive ? `/products?category=${categoryId}` : item.link;
                  
                  return (
                    <Link 
                      key={idx} 
                      to={toggleLink} 
                      className={`ql-item ${isActive ? 'active' : ''}`}
                    >
                      {item.name}
                      {isActive && <X size={12} style={{ marginLeft: '4px' }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="horizontal-filters-bar main-content-responsive">
          <div className="filter-group">
            <button 
              className={`filter-chip-pill ${sortBy !== 'default' ? 'active' : ''}`}
              onClick={() => {
                if (sortBy === 'default') setSortBy('price-low');
                else if (sortBy === 'price-low') setSortBy('price-high');
                else setSortBy('default');
              }}
            >
              <ArrowUpDown size={14} /> 
              Sort: {sortBy === 'price-low' ? 'Low to High' : sortBy === 'price-high' ? 'High to Low' : 'Price'}
              {sortBy !== 'default' && <X size={12} />}
            </button>
            <button className="filter-chip-pill" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} /> Filter
            </button>
            {isFiltered && (
              <button className="filter-chip-pill clear-filter-btn" onClick={handleClearFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="list-layout-main main-content-responsive">
        {/* Column A: Brands Vertical Scroll */}
        <aside className="brand-sidebar-vertical">
          <div 
            className={`brand-sidebar-item ${selectedBrand === null ? 'active' : ''}`}
            onClick={() => setSelectedBrand(null)}
          >
            <div className="brand-sidebar-img">
              <div className="all-brands-icon">All</div>
            </div>
            <span>All Brands</span>
          </div>
          {brands.map((brand: any, idx) => {
            const brandData = allBrands.find(b => b.name.toLowerCase() === brand.toString().toLowerCase());
            const brandLogo = brandData?.logoUrl;
            
            return (
              <div 
                key={idx} 
                className={`brand-sidebar-item ${selectedBrand === brand ? 'active' : ''}`}
                onClick={() => setSelectedBrand(brand)}
              >
                <div className="brand-sidebar-img">
                  {brandLogo && (
                    <img 
                      src={getFullImageUrl(brandLogo)} 
                      alt={brand} 
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        const fallback = parent?.querySelector('.brand-initials');
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                  )}
                  <div 
                    className="brand-initials" 
                    style={{ display: brandLogo ? 'none' : 'flex' }}
                  >
                    {brand.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <span>{brand}</span>
              </div>
            );
          })}
        </aside>

        {/* Product Grid Area */}
        <section className="list-results-area" ref={resultsAreaRef}>
          {loading && page === 1 ? (
            <div className="list-grid-3xN">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="shimmer-block" style={{ height: '180px', borderRadius: '20px' }}></div>
                  <div className="shimmer-block" style={{ height: '24px', width: '60%', marginTop: '1rem', borderRadius: '4px' }}></div>
                  <div className="shimmer-block" style={{ height: '40px', width: '100%', marginTop: '0.5rem', borderRadius: '12px' }}></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="list-grid-3xN">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : !loading ? (
            <div className="no-products">
              <p>No products found for this selection.</p>
              <button 
                className="whatsapp-contact-btn"
                onClick={() => {
                  const phoneNumber = '919216921698';
                  const message = encodeURIComponent(`Hi, I couldn't find ${selectedBrand || 'what I was looking for'} on MatAll. Can you help?`);
                  window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                }}
              >
                <MessageCircle size={20} />
                Contact us on WhatsApp
              </button>
            </div>
          ) : null}

          {hasMore && (
            <div className="infinite-loader" ref={loaderRef}>
              <div className="shimmer-block" style={{ height: '100px', width: '100%' }}></div>
            </div>
          )}

          {/* Blog Space */}
          {currentCategoryMetadata?.description && (
            <div className="category-blog-space">
               {currentCategoryMetadata.description.split('\n').filter((p: string) => p.trim() !== '').map((para: string, idx: number) => (
                 <p key={idx}>{para}</p>
               ))}
            </div>
          )}
        </section>
      </main>


      {/* Categories & Subcategories Filter Modal */}
      {showFilters && (
        <div className="category-filter-modal-overlay">
           <div className="category-filter-modal-container">
              <header className="modal-header">
                 <span>Shop by Category</span>
                 <button className="close-btn" onClick={() => setShowFilters(false)}><X size={24} /></button>
              </header>
              <div className="modal-body-layout">
                 <aside className="cat-sidebar">
                    {allCategories.map(cat => (
                       <div 
                         key={cat._id} 
                         className={`cat-tab ${activeModalCat === cat.name || activeModalCat === cat._id ? 'active' : ''}`}
                         onClick={() => setActiveModalCat(cat.name)}
                       >
                          {cat.name}
                       </div>
                    ))}
                 </aside>
                 <section className="subcat-grid-area">
                    <h3>{activeModalCat}</h3>
                    <div className="subcat-grid">
                       {modalSubCats.length > 0 ? modalSubCats.map(sc => (
                         <div 
                           key={sc._id} 
                           className="subcat-card"
                           onClick={() => {
                              navigate(`/products?category=${encodeURIComponent(activeModalCat || '')}&subCategory=${encodeURIComponent(sc.name)}`);
                              setShowFilters(false);
                           }}
                         >
                            <div className="subcat-img">
                               <img 
                                 src={(products.find(p => p.subCategory === sc.name)?.imageUrl) 
                                   ? getFullImageUrl(products.find(p => p.subCategory === sc.name)?.imageUrl) 
                                   : `https://ui-avatars.com/api/?name=${encodeURIComponent(sc.name)}&background=f1f5f9&color=000&bold=true`} 
                                 alt={sc.name} 
                               />
                            </div>
                            <span>{sc.name}</span>
                         </div>
                       )) : <p>No subcategories found.</p>}
                    </div>
                 </section>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
