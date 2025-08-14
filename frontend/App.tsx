import React, { ReactNode, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, PlusCircle, BarChart2, User, ShoppingCart, Tag, Box, ArrowLeft, Package, Mail, Calendar, Wallet, Edit, LogOut, Save, X, Plus, Minus, Trash2, DollarSign, ClipboardList, Search } from 'lucide-react';

// Extend the Window interface to include the 'aptos' property
declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string; publicKey: string }>;
      disconnect: () => Promise<void>;
      signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
      [key: string]: any;
    };
  }
}

const OWNER_WALLET_ADDRESS = "0x8d5c4b91b94347a3e878783472bde6456565ac74786411516e87a685778841a5";


// --- Mock Data ---
const initialProducts = [
    { id: 1, name: 'Quantum Widget', category: 'Widgets', price: 99.99, stock: 150 },
    { id: 2, name: 'Hyper-Sprocket', category: 'Sprockets', price: 149.50, stock: 75 },
    { id: 3, name: 'Nano-Gear', category: 'Gears', price: 45.00, stock: 300 },
    { id: 4, name: 'Flux Capacitor', category: 'Time Travel', price: 1210000, stock: 1 },
    { id: 5, name: 'Ionic Diffuser', category: 'Widgets', price: 24.99, stock: 500 },
    { id: 6, name: 'Plasma Injector', category: 'Sprockets', price: 299.00, stock: 50 },
];


// --- Helper Components ---

type AnimatedButtonProps = {
  children: ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
} & React.ComponentPropsWithoutRef<typeof motion.button>;

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  className = '',
  ...props
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    className={`px-6 py-3 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center ${className}`}
    {...props}
  >
    {children}
  </motion.button>
);

type NavLinkProps = {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

const NavLink: React.FC<NavLinkProps> = ({ icon, label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'
    }`}
    whileHover={{ x: isActive ? 0 : 5 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </motion.button>
);

type ConnectWalletButtonProps = {
    isConnected: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    walletAddress?: string | null;
};

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ isConnected, onClick, walletAddress }) => {
    const truncateAddress = (address: string) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };
    
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 font-semibold rounded-lg flex items-center justify-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isConnected 
                ? 'bg-gray-700 text-white hover:bg-gray-800 focus:ring-gray-500' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            }`}
        >
            {isConnected ? (
                <>
                    <span className="mr-3 font-mono text-sm hidden sm:inline">{truncateAddress(walletAddress || '')}</span>
                    <LogOut size={20} className="mr-2" />
                    Disconnect
                </>
            ) : (
                <>
                    <Wallet size={20} className="mr-2" />
                    Connect Wallet
                </>
            )}
        </motion.button>
    );
};

type PageContainerProps = {
    title: string;
    children: React.ReactNode;
};

const PageContainer: React.FC<PageContainerProps> = ({ title, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full p-8 bg-white rounded-2xl shadow-inner"
    >
        <h2 className="text-3xl font-bold text-gray-800 mb-6">{title}</h2>
        <div>{children}</div>
    </motion.div>
);

type DashboardCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
};

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color, onClick }) => (
    <motion.button
        onClick={onClick}
        className={`w-full text-left bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4 border-l-4 ${color} ${onClick ? 'cursor-pointer' : ''}`}
        whileHover={{ scale: onClick ? 1.03 : 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        disabled={!onClick}
    >
        <div className="p-3 bg-gray-100 rounded-full">
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </motion.button>
);


// --- Page Components ---

type Product = {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
};

type CartItem = Product & { quantity: number };

type Order = {
    id: string;
    items: CartItem[];
    total: number;
    customerAddress: string;
    timestamp: Date;
}

// NEW: Reusable ProductCard component
type ProductCardProps = {
    product: Product;
    onAddToCart?: (product: Product) => void;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
    <motion.div 
        className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
        whileHover={{ y: -5, boxShadow: "0px 15px 25px rgba(0,0,0,0.1)" }}
        transition={{ type: 'spring', stiffness: 300 }}
    >
        <div className="p-6 flex-grow">
            <p className="text-sm font-semibold text-blue-500">{product.category}</p>
            <h3 className="text-xl font-bold text-gray-800 mt-1">{product.name}</h3>
            <p className="text-2xl font-extrabold text-gray-900 mt-4">${product.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
        </div>
        {onAddToCart && (
             <div className="p-6 bg-gray-50">
                <AnimatedButton 
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock === 0}
                    className={`w-full text-white ${product.stock > 0 ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </AnimatedButton>
            </div>
        )}
    </motion.div>
);

type HomePageProps = {
    role: string;
    products?: Product[];
    cartItems?: CartItem[];
    orders?: Order[];
    ownerBalance?: number;
    onNavigate?: (page: string) => void;
};

const HomePage: React.FC<HomePageProps> = ({ role, products = [], cartItems = [], orders = [], ownerBalance, onNavigate = () => {} }) => {
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const totalCartValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <PageContainer title={`${role} Dashboard`}>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${role === 'Owner' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                {role === 'Owner' ? (
                    <>
                        <DashboardCard
                            title="Total Revenue"
                            value={`$${(ownerBalance || 0).toFixed(2)}`}
                            icon={<DollarSign size={24} className="text-yellow-500" />}
                            color="border-yellow-500"
                            onClick={() => onNavigate('orders')}
                        />
                        <DashboardCard
                            title="Total Products"
                            value={products.length}
                            icon={<Package size={24} className="text-blue-500" />}
                            color="border-blue-500"
                            onClick={() => onNavigate('stocks')}
                        />
                        <DashboardCard
                            title="Items in Stock"
                            value={totalStock}
                            icon={<BarChart2 size={24} className="text-green-500" />}
                            color="border-green-500"
                            onClick={() => onNavigate('stocks')}
                        />
                         <DashboardCard
                            title="Total Orders"
                            value={orders.length}
                            icon={<ClipboardList size={24} className="text-indigo-500" />}
                            color="border-indigo-500"
                            onClick={() => onNavigate('orders')}
                        />
                    </>
                ) : (
                    <>
                        <DashboardCard
                            title="Items in Cart"
                            value={totalCartItems}
                            icon={<ShoppingCart size={24} className="text-green-500" />}
                            color="border-green-500"
                            onClick={() => onNavigate('cart')}
                        />
                        <DashboardCard
                            title="Total Cart Value"
                            value={`$${totalCartValue.toFixed(2)}`}
                            icon={<DollarSign size={24} className="text-yellow-500" />}
                            color="border-yellow-500"
                            onClick={() => onNavigate('cart')}
                        />
                        <DashboardCard
                            title="Products to Browse"
                            value={products.length}
                            icon={<Box size={24} className="text-indigo-500" />}
                            color="border-indigo-500"
                            onClick={() => onNavigate('buy')}
                        />
                    </>
                )}
            </div>
            {role === 'Owner' && (
                <div className="mt-10 bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h3>
                    {orders.length > 0 ? (
                        <div className="space-y-3">
                            {orders.slice(0, 3).map(order => (
                                <div key={order.id} className="p-3 border rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-mono text-sm text-gray-700">{order.id.substring(0, 16)}...</p>
                                        <p className="text-xs text-gray-500">{order.items.length} item(s)</p>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No recent orders to display.</p>
                    )}
                </div>
            )}
        </PageContainer>
    );
};

type ProfilePageProps = {
    role: string;
    user: { name: string; email: string; memberSince: string; walletAddress: string; balance?: number; };
    setUser: React.Dispatch<React.SetStateAction<any>>;
    handleLogout: () => void;
};

const ProfilePage: React.FC<ProfilePageProps> = ({ role, user, setUser, handleLogout }) => { const [isEditing, setIsEditing] = useState(false); const [editableUser, setEditableUser] = useState(user); const handleEditToggle = () => { if (!isEditing) { setEditableUser(user); } setIsEditing(!isEditing); }; const handleSave = () => { setUser(editableUser); setIsEditing(false); alert('Profile updated!'); }; const handleCancel = () => { setIsEditing(false); }; const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setEditableUser(prev => ({ ...prev, [name]: value })); }; return ( <PageContainer title={isEditing ? "Edit Profile" : "Profile"}> <div className="max-w-2xl mx-auto bg-gray-50 p-8 rounded-2xl shadow-md"> <div className="flex flex-col items-center text-center"> <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-green-400 flex items-center justify-center mb-4"> <User size={64} className="text-white" /> </div> <h3 className="text-3xl font-bold text-gray-900">{user.name}</h3> <p className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold ${role === 'Owner' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{role}</p> </div> <AnimatePresence mode="wait"> {isEditing ? ( <motion.div key="edit-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-8 space-y-4"> <div> <label className="block text-sm font-medium text-gray-700">Name</label> <input type="text" name="name" value={editableUser.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/> </div> <div> <label className="block text-sm font-medium text-gray-700">Email</label> <input type="email" name="email" value={editableUser.email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/> </div> </motion.div> ) : ( <motion.div key="view-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 space-y-4 text-left"> <div className="flex items-center p-4 bg-white rounded-lg"> <Mail className="text-gray-500" size={20} /> <span className="ml-4 text-gray-700">{user.email}</span> </div> <div className="flex items-center p-4 bg-white rounded-lg"> <Calendar className="text-gray-500" size={20} /> <span className="ml-4 text-gray-700">Member Since: {user.memberSince}</span> </div> <div className="flex items-center p-4 bg-white rounded-lg"> <Wallet className="text-gray-500" size={20} /> <span className="ml-4 text-gray-700 font-mono text-sm break-all"> Wallet: {user.walletAddress || 'Not Connected'} </span> </div> </motion.div> )} </AnimatePresence> <div className="mt-8 flex space-x-4"> {isEditing ? ( <> <AnimatedButton onClick={handleSave} className="w-full bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"> <Save size={18} className="mr-2"/> Save Changes </AnimatedButton> <AnimatedButton onClick={handleCancel} className="w-full bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500"> <X size={18} className="mr-2"/> Cancel </AnimatedButton> </> ) : ( <> <AnimatedButton onClick={handleEditToggle} className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"> <Edit size={18} className="mr-2"/> Edit Profile </AnimatedButton> <AnimatedButton onClick={handleLogout} className="w-full bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"> <LogOut size={18} className="mr-2"/> Log Out </AnimatedButton> </> )} </div> </div> </PageContainer> ); };
type AddProductPageProps = { addProduct: (product: { name: string; category: string; price: number; stock: number }) => void; };
const AddProductPage: React.FC<AddProductPageProps> = ({ addProduct }) => { const [name, setName] = useState(''); const [category, setCategory] = useState(''); const [price, setPrice] = useState(''); const [stock, setStock] = useState(''); const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!name || !category || !price || !stock) { alert('Please fill all fields'); return; } addProduct({ name, category, price: parseFloat(price), stock: parseInt(stock, 10) }); setName(''); setCategory(''); setPrice(''); setStock(''); alert('Product added successfully!'); }; return ( <PageContainer title="Add Product"> <form onSubmit={handleSubmit} className="space-y-6 max-w-lg"> <div> <label className="block text-sm font-medium text-gray-700">Product Name</label> <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/> </div> <div> <label className="block text-sm font-medium text-gray-700">Category</label> <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/> </div> <div> <label className="block text-sm font-medium text-gray-700">Price</label> <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/> </div> <div> <label className="block text-sm font-medium text-gray-700">Stock</label> <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/> </div> <AnimatedButton type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"> Add Product </AnimatedButton> </form> </PageContainer> ); };
type StocksPageProps = { products: Product[]; updateProduct: (productId: number, updatedProductData: Partial<Product>) => void; deleteProduct: (productId: number) => void; };
const StocksPage: React.FC<StocksPageProps> = ({ products, updateProduct, deleteProduct }) => { const [editingProductId, setEditingProductId] = useState<number | null>(null); const [editableProduct, setEditableProduct] = useState<Partial<Product> | null>(null); const handleEditClick = (product: Product) => { setEditingProductId(product.id); setEditableProduct({ ...product }); }; const handleCancelClick = () => { setEditingProductId(null); setEditableProduct(null); }; const handleSaveClick = () => { if (editingProductId && editableProduct) { updateProduct(editingProductId, editableProduct); handleCancelClick(); } }; const handleDeleteClick = (product: Product) => { if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) { deleteProduct(product.id); } }; const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; if (editableProduct) { const isNumericField = name === 'price' || name === 'stock'; const parsedValue = isNumericField ? (value === '' ? '' : parseFloat(value)) : value; setEditableProduct({ ...editableProduct, [name]: parsedValue, }); } }; const inputClass = "w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"; return ( <PageContainer title="Product Management"> <div className="overflow-x-auto"> <table className="min-w-full bg-white rounded-lg shadow"> <thead className="bg-gray-200"> <tr> <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th> <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th> <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th> <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th> <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> </tr> </thead> <tbody className="divide-y divide-gray-200"> {products.map(product => ( <tr key={product.id} className={editingProductId === product.id ? 'bg-blue-50' : ''}> <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900"> {editingProductId === product.id ? <input name="name" value={editableProduct?.name || ''} onChange={handleInputChange} className={inputClass} /> : product.name} </td> <td className="px-6 py-4 whitespace-nowrap text-gray-500"> {editingProductId === product.id ? <input name="category" value={editableProduct?.category || ''} onChange={handleInputChange} className={inputClass} /> : product.category} </td> <td className="px-6 py-4 whitespace-nowrap text-gray-500"> {editingProductId === product.id ? <input type="number" name="price" value={editableProduct?.price || ''} onChange={handleInputChange} className={inputClass} /> : `$${product.price.toFixed(2)}`} </td> <td className="px-6 py-4 whitespace-nowrap text-gray-500"> {editingProductId === product.id ? <input type="number" name="stock" value={editableProduct?.stock || ''} onChange={handleInputChange} className={inputClass} /> : product.stock} </td> <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> {editingProductId === product.id ? ( <div className="flex items-center justify-end space-x-3"> <AnimatedButton onClick={handleSaveClick} className="!p-2 bg-green-500 text-white hover:bg-green-600"> <Save size={18} /> </AnimatedButton> <AnimatedButton onClick={handleCancelClick} className="!p-2 bg-gray-500 text-white hover:bg-gray-600"> <X size={18} /> </AnimatedButton> </div> ) : ( <div className="flex items-center justify-end space-x-3"> <AnimatedButton onClick={() => handleEditClick(product)} className="!p-2 bg-blue-500 text-white hover:bg-blue-600"> <Edit size={18} /> </AnimatedButton> <AnimatedButton onClick={() => handleDeleteClick(product)} className="!p-2 bg-red-500 text-white hover:bg-red-600"> <Trash2 size={18} /> </AnimatedButton> </div> )} </td> </tr> ))} </tbody> </table> </div> </PageContainer> ); };

// MODIFIED: BuyProductPage now uses the reusable ProductCard
const BuyProductPage: React.FC<{products: Product[], addToCart: (product: Product) => void}> = ({ products, addToCart }) => (
    <PageContainer title="Browse Products">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
        </div>
    </PageContainer>
);

// OVERHAULED: CategoriesPage is now a dynamic search and filter page
type CategoriesPageProps = {
    products: Product[];
    role: string;
    addToCart: (product: Product) => void;
};
const CategoriesPage: React.FC<CategoriesPageProps> = ({ products, role, addToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products]);

    const filteredProducts = useMemo(() => {
        return products
            .filter(product => selectedCategory === 'All' || product.category === selectedCategory)
            .filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, selectedCategory, searchTerm]);
    
    return (
        <PageContainer title="Browse by Category">
            <div className="mb-8 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Search for products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                                selectedCategory === category 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map(product => (
                         <ProductCard 
                            key={product.id} 
                            product={product} 
                            onAddToCart={role === 'Customer' ? addToCart : undefined} 
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 mt-12">No products found matching your criteria.</p>
            )}
        </PageContainer>
    );
};
type CartPageProps = { cartItems: CartItem[]; updateCartQuantity: (productId: number, newQuantity: number) => void; handlePurchase: () => void; };
const CartPage: React.FC<CartPageProps> = ({ cartItems, updateCartQuantity, handlePurchase }) => { const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0); return ( <PageContainer title="Shopping Cart"> {cartItems.length === 0 ? ( <div className='text-center'> <p className='text-gray-600 text-lg'>Your cart is empty.</p> <p className='text-gray-500 mt-2'>Looks like you haven't added any products yet!</p> </div> ) : ( <> <div className="space-y-4"> {cartItems.map((item) => ( <div key={item.id} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg"> <div className="flex-grow"> <p className="font-bold">{item.name}</p> <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p> </div> <div className="flex items-center space-x-4"> <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={16}/></button> <span className="font-semibold text-lg">{item.quantity}</span> <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={16}/></button> </div> <p className="font-semibold w-24 text-right">${(item.price * item.quantity).toFixed(2)}</p> <button onClick={() => updateCartQuantity(item.id, 0)} className="ml-4 p-2 rounded-full hover:bg-red-100 text-red-500"><Trash2 size={20}/></button> </div> ))} </div> <div className="pt-6 mt-6 border-t-2 border-gray-200"> <div className="flex justify-between items-center"> <p className="text-xl font-bold">Total:</p> <p className="text-2xl font-extrabold">${totalPrice.toFixed(2)}</p> </div> <div className="mt-6"> <AnimatedButton onClick={handlePurchase} className="w-full bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"> <Wallet size={20} className="mr-2" /> Purchase Now </AnimatedButton> <p className="text-xs text-gray-500 mt-2 text-center"> You will be prompted to sign a transaction with your wallet. The prices are simulated as APT for this demo. </p> </div> </div> </> )} </PageContainer> ); };
type OrdersPageProps = { orders: Order[]; };
const OrdersPage: React.FC<OrdersPageProps> = ({ orders }) => { const [activeOrderId, setActiveOrderId] = useState<string | null>(null); return ( <PageContainer title="Order History"> {orders.length === 0 ? ( <div className='text-center'> <p className='text-gray-600 text-lg'>No orders have been placed yet.</p> </div> ) : ( <div className="space-y-4"> {orders.map(order => ( <div key={order.id} className="bg-white rounded-lg shadow-md border"> <button onClick={() => setActiveOrderId(activeOrderId === order.id ? null : order.id)} className="w-full text-left p-4 focus:outline-none" > <div className="flex justify-between items-center"> <div> <p className="font-bold text-blue-600">Order ID</p> <p className="font-mono text-sm text-gray-700">{order.id.substring(0, 16)}...</p> </div> <div> <p className="font-bold text-blue-600">Date</p> <p className="text-sm text-gray-700">{order.timestamp.toLocaleDateString()}</p> </div> <div> <p className="font-bold text-blue-600">Total</p> <p className="text-lg font-semibold text-gray-900">${order.total.toFixed(2)}</p> </div> </div> </button> <AnimatePresence> {activeOrderId === order.id && ( <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden" > <div className="border-t p-4"> <h4 className="font-semibold mb-2">Items Purchased:</h4> <ul className="space-y-1"> {order.items.map(item => ( <li key={item.id} className="flex justify-between text-sm"> <span>{item.name} (x{item.quantity})</span> <span className='text-gray-600'>${(item.price * item.quantity).toFixed(2)}</span> </li> ))} </ul> </div> </motion.div> )} </AnimatePresence> </div> ))} </div> )} </PageContainer> ); };


// --- Main Panel Components ---

type OwnerPanelProps = { onNavigate: (page: string) => void; products: Product[]; orders: Order[]; user: { name: string; email: string; memberSince: string; walletAddress: string; balance: number; }; addProduct: (product: { name: string; category: string; price: number; stock: number }) => void; updateProduct: (productId: number, updatedProductData: Partial<Product>) => void; deleteProduct: (productId: number) => void; role: string; walletConnected: boolean; handleWalletToggle: () => void; setUser: React.Dispatch<React.SetStateAction<any>>; walletAddress: string | null; handleLogout: () => void; };
type OwnerPageKey = 'home' | 'addProduct' | 'stocks' | 'orders' | 'profile' | 'categories';

const OwnerPanel: React.FC<OwnerPanelProps> = ({ onNavigate, products, orders, user, addProduct, updateProduct, deleteProduct, role, walletConnected, handleWalletToggle, setUser, walletAddress, handleLogout }) => {
  const [activePage, setActivePage] = useState<OwnerPageKey>('home');

  const ownerPages: Record<OwnerPageKey, React.ReactNode> = {
    home: <HomePage role={role} products={products} ownerBalance={user.balance} orders={orders} onNavigate={setActivePage} />,
    addProduct: <AddProductPage addProduct={addProduct} />,
    stocks: <StocksPage products={products} updateProduct={updateProduct} deleteProduct={deleteProduct} />,
    orders: <OrdersPage orders={orders} />,
    profile: <ProfilePage role={role} user={user} setUser={setUser} handleLogout={handleLogout} />,
    categories: <CategoriesPage products={products} role={role} addToCart={() => {}} />,
  };

  const ownerNavItems = [ { id: 'home', label: 'Home', icon: <Home size={22} /> }, { id: 'orders', label: 'Orders', icon: <ClipboardList size={22} /> }, { id: 'categories', label: 'Browse Categories', icon: <Tag size={22} /> }, { id: 'addProduct', label: 'Add Product', icon: <PlusCircle size={22} /> }, { id: 'stocks', label: 'Manage Products', icon: <BarChart2 size={22} /> }, { id: 'profile', label: 'Profile', icon: <User size={22} /> }, ]; return ( <div className="flex w-full h-screen bg-gray-100"> <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="w-72 bg-white p-6 flex flex-col shadow-lg shrink-0" > <div className="flex items-center mb-10"> <Package size={32} className="text-blue-600" /> <h1 className="text-2xl font-bold ml-3 text-gray-800">Owner Panel</h1> </div> <nav className="flex flex-col space-y-3"> {ownerNavItems.map(item => ( <NavLink key={item.id} icon={item.icon} label={item.label} isActive={activePage === item.id} onClick={() => setActivePage(item.id as OwnerPageKey)} /> ))} </nav> <div className="mt-auto"> <button onClick={() => onNavigate('landing')} className="flex items-center w-full px-4 py-3 text-left text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200"> <ArrowLeft size={22} /> <span className="ml-4 font-medium">Back to Main</span> </button> </div> </motion.div> <div className="flex-1 flex flex-col"> <header className="flex justify-end items-center p-4 bg-white border-b border-gray-200"> <ConnectWalletButton isConnected={walletConnected} onClick={handleWalletToggle} walletAddress={walletAddress} /> </header> <main className="flex-1 p-8 overflow-y-auto bg-gray-50"> <AnimatePresence mode="wait"> {ownerPages[activePage]} </AnimatePresence> </main> </div> </div> );
};

type CustomerPanelProps = { onNavigate: (page: string) => void; products: Product[]; cartItems: CartItem[]; addToCart: (product: Product) => void; updateCartQuantity: (productId: number, newQuantity: number) => void; handlePurchase: () => void; role: string; walletConnected: boolean; handleWalletToggle: () => void; user: { name: string; email: string; memberSince: string; walletAddress: string; }; setUser: React.Dispatch<React.SetStateAction<any>>; walletAddress: string | null; handleLogout: () => void; };
type CustomerPageKey = 'home' | 'buy' | 'categories' | 'cart' | 'profile';

const CustomerPanel: React.FC<CustomerPanelProps> = ({ onNavigate, products, cartItems, addToCart, updateCartQuantity, handlePurchase, role, walletConnected, handleWalletToggle, user, setUser, walletAddress, handleLogout }) => {
  const [activePage, setActivePage] = useState<CustomerPageKey>('home');

  const customerPages: Record<CustomerPageKey, React.ReactNode> = {
    home: <HomePage role={role} products={products} cartItems={cartItems} onNavigate={setActivePage} />,
    buy: <BuyProductPage products={products} addToCart={addToCart} />,
    categories: <CategoriesPage products={products} role={role} addToCart={addToCart} />,
    cart: <CartPage cartItems={cartItems} updateCartQuantity={updateCartQuantity} handlePurchase={handlePurchase} />,
    profile: <ProfilePage role={role} user={user} setUser={setUser} handleLogout={handleLogout} />,
  };

  const customerNavItems = [ { id: 'home', label: 'Home', icon: <Home size={22} /> }, { id: 'buy', label: 'Buy Products', icon: <Box size={22} /> }, { id: 'categories', label: 'Categories', icon: <Tag size={22} /> }, { id: 'cart', label: 'Cart', icon: <ShoppingCart size={22} /> }, { id: 'profile', label: 'Profile', icon: <User size={22} /> }, ]; return ( <div className="flex w-full h-screen bg-gray-50"> <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="w-64 bg-white p-6 flex flex-col shadow-lg shrink-0" > <div className="flex items-center mb-10"> <ShoppingCart size={32} className="text-green-600" /> <h1 className="text-2xl font-bold ml-3 text-gray-800">Customer</h1> </div> <nav className="flex flex-col space-y-3"> {customerNavItems.map(item => ( <NavLink key={item.id} icon={item.icon} label={item.label} isActive={activePage === item.id} onClick={() => setActivePage(item.id as CustomerPageKey)} /> ))} </nav> <div className="mt-auto"> <button onClick={() => onNavigate('landing')} className="flex items-center w-full px-4 py-3 text-left text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200"> <ArrowLeft size={22} /> <span className="ml-4 font-medium">Back to Main</span> </button> </div> </motion.div> <div className="flex-1 flex flex-col"> <header className="flex justify-end items-center p-4 bg-white border-b border-gray-200"> <ConnectWalletButton isConnected={walletConnected} onClick={handleWalletToggle} walletAddress={walletAddress} /> </header> <main className="flex-1 p-8 overflow-y-auto"> <AnimatePresence mode="wait"> {customerPages[activePage]} </AnimatePresence> </main> </div> </div> );
};

const LandingPage: React.FC<{onNavigate: (page: string) => void}> = ({ onNavigate }) => ( <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4"> <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-center mb-12" > <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4"> PHANTOM ECOM </h1> <p className="text-xl text-gray-400"> Please select your role to proceed. </p> </motion.div> <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8"> <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}> <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl border border-blue-500/50 flex flex-col items-center text-center"> <Package size={48} className="text-blue-400 mb-4" /> <h2 className="text-3xl font-bold mb-2">Owner</h2> <p className="text-gray-400 mb-6 max-w-xs">Manage products, view stock levels, and oversee categories.</p> <AnimatedButton onClick={() => onNavigate('owner')} className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"> Enter Owner Panel </AnimatedButton> </div> </motion.div> <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }}> <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl border border-green-500/50 flex flex-col items-center text-center"> <ShoppingCart size={48} className="text-green-400 mb-4" /> <h2 className="text-3xl font-bold mb-2">Customer</h2> <p className="text-gray-400 mb-6 max-w-xs">Browse products, manage your profile, and view your cart.</p> <AnimatedButton onClick={() => onNavigate('customer')} className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"> Go to Store </AnimatedButton> </div> </motion.div> </div> </div> );


// --- Main App Component ---

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [products, setProducts] = useState(initialProducts);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const [ownerUser, setOwnerUser] = useState({ name: 'Admin User', email: 'admin@dapp.com', memberSince: '2024-01-01', walletAddress: '', balance: 0, });
  const [customerUser, setCustomerUser] = useState({ name: 'Valued Customer', email: 'customer@example.com', memberSince: '2024-02-15', walletAddress: '', });

  useEffect(() => { if (currentPage === 'landing') return; const activeUserSetter = currentPage === 'owner' ? setOwnerUser : setCustomerUser; activeUserSetter(prevUser => ({ ...prevUser, walletAddress: walletAddress || '' })); }, [walletAddress, currentPage]);

  const handleNavigation = (page: string) => setCurrentPage(page);
  
  const handleWalletToggle = async () => { if (walletConnected) { if (window.aptos && window.aptos.disconnect) { await window.aptos.disconnect(); } setWalletConnected(false); setWalletAddress(null); alert("Wallet disconnected."); } else { const isPetraInstalled = 'aptos' in window; if (!isPetraInstalled) { alert('Petra Wallet not found. Please install the extension.'); return; } try { const response = await window.aptos.connect(); const address = response.address; setWalletAddress(address); setWalletConnected(true); alert(`Wallet connected successfully!`); } catch (error) { console.error("Wallet connection failed:", error); } } };
  const handleLogout = () => { if (walletConnected) { handleWalletToggle(); } handleNavigation('landing'); };
  const addProduct = (newProduct: { name: string; category: string; price: number; stock: number }) => { setProducts(prevProducts => [ ...prevProducts, { ...newProduct, id: prevProducts.length + 1 } ]); };
  const updateProduct = (productId: number, updatedProductData: Partial<Product>) => { setProducts(prevProducts => prevProducts.map(product => product.id === productId ? { ...product, ...updatedProductData } : product ) ); };
  const deleteProduct = (productId: number) => { setProducts(prevProducts => prevProducts.filter(product => product.id !== productId)); };
  const addToCart = (productToAdd: Product) => { setCartItems(prevCart => { const existingItem = prevCart.find(item => item.id === productToAdd.id); if (existingItem) { return prevCart.map(item => item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item ); } return [...prevCart, { ...productToAdd, quantity: 1 }]; }); alert(`${productToAdd.name} added to cart!`); };
  const updateCartQuantity = (productId: number, newQuantity: number) => { setCartItems(prevCart => { if (newQuantity <= 0) { return prevCart.filter(item => item.id !== productId); } return prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item ); }); };
  const handlePurchase = async () => { if (!walletConnected || !window.aptos || !walletAddress) { alert('Please connect your Petra wallet before making a purchase.'); return; } if (cartItems.length === 0) { alert('Your cart is empty!'); return; } for (const item of cartItems) { const productInStock = products.find(p => p.id === item.id); if (!productInStock || productInStock.stock < item.quantity) { alert(`Sorry, there is not enough stock for ${item.name}. Available: ${productInStock?.stock || 0}.`); return; } } const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0); const amountInOcta = Math.round(totalPrice * (10 ** 8)); const payload = { function: '0x1::aptos_account::transfer', type_arguments: [], arguments: [OWNER_WALLET_ADDRESS, amountInOcta], }; try { const pendingTransaction = await window.aptos.signAndSubmitTransaction(payload); let newProducts = [...products]; for (const item of cartItems) { newProducts = newProducts.map(p => p.id === item.id ? { ...p, stock: p.stock - item.quantity } : p ); } setProducts(newProducts); const newOrder: Order = { id: pendingTransaction.hash, items: [...cartItems], total: totalPrice, customerAddress: walletAddress, timestamp: new Date(), }; setOrders(prevOrders => [newOrder, ...prevOrders]); setOwnerUser(prev => ({ ...prev, balance: prev.balance + totalPrice })); setCartItems([]); alert(`Purchase successful! Your order has been placed. Txn hash: ${pendingTransaction.hash}`); } catch (error) { console.error('Purchase failed:', error); alert(`Purchase failed. Please check the console for details.`); } };
  
  const renderPage = () => {
    switch (currentPage) {
      case 'owner':
        return <OwnerPanel key="owner" onNavigate={handleNavigation} products={products} orders={orders} user={ownerUser} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} role="Owner" walletConnected={walletConnected} handleWalletToggle={handleWalletToggle} setUser={setOwnerUser} walletAddress={walletAddress} handleLogout={handleLogout} />;
      case 'customer':
        return <CustomerPanel key="customer" onNavigate={handleNavigation} products={products} cartItems={cartItems} addToCart={addToCart} updateCartQuantity={updateCartQuantity} handlePurchase={handlePurchase} role="Customer" walletConnected={walletConnected} handleWalletToggle={handleWalletToggle} user={customerUser} setUser={setCustomerUser} walletAddress={walletAddress} handleLogout={handleLogout} />;
      case 'landing':
      default:
        return <LandingPage key="landing" onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="antialiased bg-gray-50">
        <AnimatePresence mode="wait">
            {renderPage()}
        </AnimatePresence>
    </div>
  );
}