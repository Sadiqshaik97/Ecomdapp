// import { useState, useEffect } from 'react';
// import { ShoppingCart, ShoppingBag, Plus, Tag, Package, Trash2, Edit, Save, DollarSign, Wand2 } from 'lucide-react';

// const ownerAddress = "0x1234567890abcdef";
// const customerAddress = "0xabcdef1234567890";

// const initialProducts = [
//   { name: "Aptos T-Shirt", price: 20, stock: 50, description: "A classic t-shirt featuring the Aptos logo, perfect for showing your blockchain pride." },
//   { name: "Aptos Mug", price: 15, stock: 100, description: "Start your day with a hot cup of coffee in this Aptos-branded mug." },
//   { name: "Aptos Hat", price: 25, stock: 25, description: "A stylish and comfortable hat to complete your Aptos-themed look." },
// ];

// function App() {
//   const [products, setProducts] = useState(initialProducts);
//   const [customerOrders, setCustomerOrders] = useState([]);
//   const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '' });
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [updatedProduct, setUpdatedProduct] = useState({});
//   const [currentPage, setCurrentPage] = useState('home');
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [message, setMessage] = useState('');

//   // A simple message box component to replace `alert`
//   const MessageBox = ({ message, onClose }) => {
//     if (!message) return null;
//     return (
//       <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
//         <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center">
//           <p className="text-gray-800 font-semibold">{message}</p>
//           <button onClick={onClose} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
//             Close
//           </button>
//         </div>
//       </div>
//     );
//   };

//   // Helper function to simulate a contract call
//   const simulateContractCall = (functionName, args) => {
//     console.log(`Simulating contract call: ${functionName} with args:`, args);
//   };

//   // GEMINI API INTEGRATION: Generates a product description
//   const generateProductDescription = async () => {
//     if (!newProduct.name) {
//       setMessage('Please enter a product name first!');
//       return;
//     }
//     setIsGenerating(true);

//     try {
//       const prompt = `Write a concise and creative product description for an e-commerce website for a product named "${newProduct.name}". The description should be under 30 words.`;
//       const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
//       const payload = { contents: chatHistory };
//       const apiKey = "" // If you want to use models other than gemini-2.5-flash-preview-05-20 or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
//       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

//       const response = await fetch(apiUrl, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });
//       const result = await response.json();

//       if (result.candidates && result.candidates.length > 0 &&
//           result.candidates[0].content && result.candidates[0].content.parts &&
//           result.candidates[0].content.parts.length > 0) {
//         const text = result.candidates[0].content.parts[0].text;
//         setNewProduct(prev => ({ ...prev, description: text }));
//       } else {
//         setMessage('Failed to generate description. Please try again.');
//       }
//     } catch (error) {
//       console.error("Error calling Gemini API:", error);
//       setMessage('An error occurred while generating the description.');
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   // OWNER FUNCTIONS
//   const createProduct = () => {
//     if (newProduct.name && newProduct.price && newProduct.stock) {
//       const productPrice = parseInt(newProduct.price, 10);
//       const productStock = parseInt(newProduct.stock, 10);
//       const productExists = products.some(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
//       if (productExists) {
//         setMessage('Product with this name already exists.');
//         return;
//       }
//       const newProducts = [...products, { ...newProduct, price: productPrice, stock: productStock }];
//       setProducts(newProducts);
//       simulateContractCall('create_product', [ownerAddress, newProduct.name, productPrice, productStock, newProduct.description]);
//       setNewProduct({ name: '', price: '', stock: '', description: '' });
//     }
//   };

//   const startEditProduct = (product) => {
//     setEditingProduct(product.name);
//     setUpdatedProduct({ name: product.name, price: product.price, stock: product.stock, description: product.description });
//   };

//   const saveProductUpdate = () => {
//     const updatedProducts = products.map(p => {
//       if (p.name === editingProduct) {
//         return { ...p, price: updatedProduct.price, stock: updatedProduct.stock, description: updatedProduct.description };
//       }
//       return p;
//     });
//     setProducts(updatedProducts);
//     simulateContractCall('update_product', [ownerAddress, updatedProduct.name, updatedProduct.price, updatedProduct.stock, updatedProduct.description]);
//     setEditingProduct(null);
//     setUpdatedProduct({});
//   };

//   const deleteProduct = (name) => {
//     const newProducts = products.filter(p => p.name !== name);
//     setProducts(newProducts);
//     simulateContractCall('delete_product', [ownerAddress, name]);
//   };

//   // CUSTOMER FUNCTIONS
//   const buyProduct = (productName) => {
//     const updatedProducts = products.map(p => {
//       if (p.name === productName) {
//         if (p.stock > 0) {
//           const newStock = p.stock - 1;
//           const newOrder = {
//             id: customerOrders.length + 1,
//             product_name: productName,
//             price_paid: p.price,
//             customer: customerAddress
//           };
//           setCustomerOrders([...customerOrders, newOrder]);
//           simulateContractCall('buy_product', [customerAddress, ownerAddress, productName]);
//           return { ...p, stock: newStock };
//         } else {
//           setMessage('Sorry, this item is out of stock!');
//           return p;
//         }
//       }
//       return p;
//     });
//     setProducts(updatedProducts);
//   };

//   const renderProductList = () => (
//     <div className="space-y-6">
//       {products.length > 0 ? (
//         products.map(product => (
//           <div key={product.name} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white rounded-lg shadow-md transition-transform transform hover:scale-105">
//             <div className="flex-grow">
//               <h3 className="text-xl font-semibold text-gray-800 flex items-center">
//                 <ShoppingBag className="mr-2 text-indigo-500" />
//                 {product.name}
//               </h3>
//               <p className="text-gray-600 mt-1 ml-6">Price: <span className="font-bold">${product.price}</span> | Stock: <span className="font-bold">{product.stock}</span></p>
//               <p className="text-gray-500 italic mt-2 ml-6 text-sm">{product.description}</p>
//             </div>
//             <button
//               onClick={() => buyProduct(product.name)}
//               disabled={product.stock === 0}
//               className={`mt-4 md:mt-0 flex items-center px-4 py-2 text-white font-semibold rounded-full shadow-md transition-all duration-300 ${
//                 product.stock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
//               }`}
//             >
//               <ShoppingCart className="mr-2" size={20} />
//               {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
//             </button>
//           </div>
//         ))
//       ) : (
//         <p className="text-center text-gray-500">No products available.</p>
//       )}
//     </div>
//   );

//   const renderOwnerPanel = () => (
//     <div className="space-y-8 p-6 bg-gray-50 rounded-lg shadow-inner">
//       <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 flex items-center">
//         <Plus className="mr-2 text-blue-500" /> Manage Products
//       </h2>
//       <div className="bg-white p-4 rounded-lg shadow-md">
//         <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Product</h3>
//         <div className="flex flex-col gap-4">
//           <input
//             type="text"
//             placeholder="Product Name"
//             value={newProduct.name}
//             onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
//             className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//           />
//           <div className="flex flex-col md:flex-row gap-4">
//             <input
//               type="number"
//               placeholder="Price"
//               value={newProduct.price}
//               onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
//               className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//             />
//             <input
//               type="number"
//               placeholder="Stock"
//               value={newProduct.stock}
//               onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
//               className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//             />
//           </div>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={generateProductDescription}
//               disabled={isGenerating}
//               className={`flex-grow px-4 py-2 text-white font-semibold rounded-md shadow-md transition-colors ${
//                 isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
//               } flex items-center justify-center`}
//             >
//               {isGenerating ? 'Generating...' : <>✨ Generate Description</>}
//             </button>
//             <button
//               onClick={createProduct}
//               className="w-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition-colors"
//             >
//               Create Product
//             </button>
//           </div>
//           {newProduct.description && (
//             <textarea
//               placeholder="Product Description"
//               value={newProduct.description}
//               onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
//               className="w-full p-2 border border-gray-300 rounded-md h-24 mt-2 resize-none"
//             />
//           )}
//         </div>
//       </div>
//       <div className="space-y-4">
//         {products.map(product => (
//           <div key={product.name} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
//             {editingProduct === product.name ? (
//               <div className="flex-grow flex flex-col gap-4">
//                 <input type="text" value={updatedProduct.name} disabled className="p-2 border border-gray-300 rounded-md bg-gray-100" />
//                 <div className="flex flex-col md:flex-row gap-4">
//                   <input
//                     type="number"
//                     value={updatedProduct.price}
//                     onChange={(e) => setUpdatedProduct({ ...updatedProduct, price: e.target.value })}
//                     className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
//                   />
//                   <input
//                     type="number"
//                     value={updatedProduct.stock}
//                     onChange={(e) => setUpdatedProduct({ ...updatedProduct, stock: e.target.value })}
//                     className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
//                   />
//                 </div>
//                 <textarea
//                   value={updatedProduct.description}
//                   onChange={(e) => setUpdatedProduct({ ...updatedProduct, description: e.target.value })}
//                   className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
//                 />
//                 <button
//                   onClick={saveProductUpdate}
//                   className="w-full px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition-colors flex items-center justify-center"
//                 >
//                   <Save size={16} className="mr-1" /> Save
//                 </button>
//               </div>
//             ) : (
//               <div className="flex-grow">
//                 <div className="text-xl font-semibold text-gray-800 flex items-center">
//                   <Package className="mr-2 text-indigo-500" />
//                   {product.name}
//                 </div>
//                 <div className="text-gray-600 mt-1 ml-6">
//                   <p>Price: <span className="font-bold">${product.price}</span></p>
//                   <p>Stock: <span className="font-bold">{product.stock}</span></p>
//                   <p className="text-gray-500 italic mt-2 text-sm">{product.description}</p>
//                 </div>
//               </div>
//             )}
//             <div className="flex gap-2">
//               <button onClick={() => startEditProduct(product)} className="p-2 text-gray-500 hover:text-green-500 transition-colors">
//                 <Edit size={20} />
//               </button>
//               <button onClick={() => deleteProduct(product.name)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
//                 <Trash2 size={20} />
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   const renderCustomerPanel = () => (
//     <div className="space-y-8 p-6 bg-gray-50 rounded-lg shadow-inner">
//       <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 flex items-center">
//         <ShoppingCart className="mr-2 text-blue-500" /> My Orders ({customerOrders.length})
//       </h2>
//       {customerOrders.length > 0 ? (
//         <div className="space-y-4">
//           {customerOrders.map(order => (
//             <div key={order.id} className="p-4 bg-white rounded-lg shadow-md flex justify-between items-center">
//               <div>
//                 <p className="font-semibold text-lg text-gray-800">Order #{order.id}: {order.product_name}</p>
//                 <p className="text-gray-600 mt-1">Paid: <span className="font-bold text-green-600">${order.price_paid}</span></p>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <p className="text-center text-gray-500">You have no orders yet. Start shopping!</p>
//       )}
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gray-100 font-sans p-4">
//       <script src="https://cdn.tailwindcss.com"></script>
//       <MessageBox message={message} onClose={() => setMessage('')} />
//       <div className="max-w-4xl mx-auto py-8">
//         <header className="text-center mb-10">
//           <h1 className="text-5xl font-extrabold text-gray-900 leading-tight flex items-center justify-center">
//             <Tag className="text-indigo-600 mr-4" size={48} />
//             Aptos E-commerce
//           </h1>
//           <p className="mt-4 text-lg text-gray-600">A simple, simulated shop on the Aptos blockchain.</p>
//         </header>

//         <nav className="flex justify-center space-x-4 mb-8">
//           <button
//             onClick={() => setCurrentPage('home')}
//             className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${
//               currentPage === 'home' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 hover:bg-gray-200'
//             }`}
//           >
//             Home
//           </button>
//           <button
//             onClick={() => setCurrentPage('owner')}
//             className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${
//               currentPage === 'owner' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 hover:bg-gray-200'
//             }`}
//           >
//             Shop Owner Panel
//           </button>
//           <button
//             onClick={() => setCurrentPage('customer')}
//             className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${
//               currentPage === 'customer' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 hover:bg-gray-200'
//             }`}
//           >
//             My Orders
//           </button>
//         </nav>

//         <main className="bg-white rounded-xl shadow-2xl p-8">
//           {currentPage === 'home' && renderProductList()}
//           {currentPage === 'owner' && renderOwnerPanel()}
//           {currentPage === 'customer' && renderCustomerPanel()}
//         </main>
//       </div>
//     </div>
//   );
// }

// export default App;
