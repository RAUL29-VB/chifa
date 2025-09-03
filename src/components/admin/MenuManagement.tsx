import { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { menuService } from '../../services/menuService';


import { 
  ShoppingBag, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  ChefHat, 
  Utensils, 
  Coffee, 
  Wine, 
  Package, 
  Star,
  Clock
} from 'lucide-react';

function MenuManagement() {
  useEffect(() => {
    const loadData = async () => {
      try {
        const [items, categories] = await Promise.all([
          menuService.getMenuItems(),
          menuService.getCategories()
        ]);
        
        
        // Reemplazar todos los datos de una vez
        dispatch({ type: 'SET_MENU_DATA', items, categories });
        
        // Establecer la primera categoría como default
        if (categories.length > 0) {
          setNewItem(prev => ({ ...prev, category: categories[0].name }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  const [newItem, setNewItem] = useState({
    name: '',
    price: 0,
    category: '',
    description: '',
    preparationTime: 10,
    isSpicy: false,
    isVegetarian: false
  });
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const { state, dispatch } = usePos();

  const handleAddItem = async () => {
    if (!newItem.name || newItem.price <= 0) return;
    
    try {
      if (editingItem) {
        const updatedItem = await menuService.updateMenuItem(editingItem, {
          ...newItem,
          available: true
        });
        dispatch({ 
          type: 'UPDATE_MENU_ITEM', 
          item: { id: updatedItem.$id!, ...updatedItem }
        });
        setEditingItem(null);
      } else {
        const item = await menuService.createMenuItem({
          ...newItem,
          available: true
        });
        dispatch({ type: 'ADD_MENU_ITEM', item: { id: item.$id!, ...item } });
      }
      
      setNewItem({
        name: '',
        price: 0,
        category: state.categories.length > 0 ? state.categories[0] : '',
        description: '',
        preparationTime: 10,
        isSpicy: false,
        isVegetarian: false
      });
      setShowNewItemForm(false);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory || state.categories.includes(newCategory)) return;
    
    try {
      await menuService.createCategory({ name: newCategory });
      dispatch({ type: 'ADD_CATEGORY', category: newCategory });
      setNewCategory('');
      setShowNewCategoryForm(false);
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error al agregar categoría');
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryUpper = category.toUpperCase();
    switch (categoryUpper) {
      case 'AEROPUERTOS': return <Package className="w-4 h-4" />;
      case 'CHAUFAS': return <ChefHat className="w-4 h-4" />;
      case 'COMBINADOS': return <Star className="w-4 h-4" />;
      case 'PLATOS ESPECIALES': return <Utensils className="w-4 h-4" />;
      case 'PLATOS DULCES': return <Coffee className="w-4 h-4" />;
      case 'SOPAS': return <Coffee className="w-4 h-4" />;
      case 'GASEOSAS': return <Wine className="w-4 h-4" />;
      case 'BEBIDAS CALIENTES': return <Wine className="w-4 h-4" />;
      case 'TALLARINES': return <Package className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Gestión de Menú</h2>
            <p className="text-gray-600 mt-1">Administra productos, categorías y precios</p>
          </div>
          <div className="flex space-x-4">


            <button
              onClick={() => setShowNewItemForm(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Nuevo Producto</span>
            </button>
          </div>
        </div>
        
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">{state.menuItems.length}</div>
            <div className="text-sm text-blue-600 font-medium">Total Productos</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="text-2xl font-bold text-green-800">{state.menuItems.filter(item => item.available).length}</div>
            <div className="text-sm text-green-600 font-medium">Disponibles</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">{state.categories.length}</div>
            <div className="text-sm text-yellow-600 font-medium">Categorías</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="text-2xl font-bold text-purple-800">S/ {(state.menuItems.reduce((sum, item) => sum + item.price, 0) / state.menuItems.length || 0).toFixed(2)}</div>
            <div className="text-sm text-purple-600 font-medium">Precio Promedio</div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <Package className="w-6 h-6 text-red-600" />
            <span>Categorías</span>
          </h3>
          <button
            onClick={() => setShowNewCategoryForm(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Agregar</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {state.categories.map((category) => {
            const itemCount = state.menuItems.filter(item => item.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:scale-105 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <div className={`p-3 rounded-full shadow-sm ${
                    selectedCategory === category ? 'bg-red-100' : 'bg-white'
                  }`}>
                    {getCategoryIcon(category)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800 text-sm">{category}</div>
                  <div className="text-xs text-gray-600 mt-1">{itemCount} productos</div>
                </div>
              </button>
            );
          })}
        </div>

        {showNewCategoryForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex space-x-3">
              <label htmlFor="new-category-input" className="sr-only">
                Nombre de la categoría
              </label>
              <input
                id="new-category-input"
                type="text"
                placeholder="Nombre de la categoría"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={handleAddCategory}
                aria-label="Guardar nueva categoría"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNewCategoryForm(false)}
                aria-label="Cancelar"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <ShoppingBag className="w-6 h-6 text-red-600" />
              <span>Productos del Menú</span>
              {selectedCategory && (
                <span className="text-sm font-normal text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  Filtrando: {selectedCategory}
                </span>
              )}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.menuItems
              .filter(item => !selectedCategory || item.category === selectedCategory)
              .map((item) => (
              <div key={item.id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(item.category)}
                    <span className="text-sm font-medium text-gray-600">{item.category}</span>
                  </div>
                  <div className="flex space-x-1">
                    {item.isSpicy && <span className="text-lg">🌶️</span>}
                    {item.isVegetarian && <span className="text-lg">🌱</span>}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-2xl font-bold text-red-600">S/ {item.price.toFixed(2)}</div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{item.preparationTime} min</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.available ? 'Disponible' : 'No disponible'}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            await menuService.updateMenuItem(item.id, { available: !item.available });
                            dispatch({ type: 'TOGGLE_ITEM_AVAILABILITY', itemId: item.id });
                          } catch (error) {
                            console.error('Error updating availability:', error);
                            alert('Error al actualizar disponibilidad');
                          }
                        }}
                        aria-label={item.available ? "Marcar como no disponible" : "Marcar como disponible"}
                        className={`p-2 rounded-lg transition-colors ${
                          item.available 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {item.available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingItem(item.id);
                          setNewItem({
                            name: item.name,
                            price: item.price,
                            category: item.category,
                            description: item.description || '',
                            preparationTime: item.preparationTime,
                            isSpicy: item.isSpicy,
                            isVegetarian: item.isVegetarian
                          });
                          setShowNewItemForm(true);
                        }}
                        aria-label="Editar producto" 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            await menuService.deleteMenuItem(item.id);
                            dispatch({ type: 'DELETE_MENU_ITEM', itemId: item.id });
                          } catch (error) {
                            console.error('Error deleting item:', error);
                            alert('Error al eliminar el producto');
                          }
                        }}
                        aria-label="Eliminar producto"
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Item Form */}
      {showNewItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    {editingItem ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                    </h3>
                    <p className="text-red-100 text-sm">
                      {editingItem ? 'Modifica la información del producto' : 'Completa los datos del nuevo producto'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowNewItemForm(false);
                    setEditingItem(null);
                    setNewItem({
                      name: '',
                      price: 0,
                      category: state.categories.length > 0 ? state.categories[0] : '',
                      description: '',
                      preparationTime: 10,
                      isSpicy: false,
                      isVegetarian: false
                    });
                  }}
                  aria-label="Cerrar modal"
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <Utensils className="w-5 h-5 text-red-600" />
                      <span>Información Básica</span>
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="item-name" className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Producto</label>
                        <input
                          id="item-name"
                          type="text"
                          placeholder="Ej: Arroz Chaufa Especial"
                          value={newItem.name}
                          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="item-price" className="block text-sm font-semibold text-gray-700 mb-2">Precio (S/)</label>
                          <input
                            id="item-price"
                            type="text"
                            placeholder="0.00"
                            value={newItem.price === 0 ? '' : newItem.price.toString()}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setNewItem({...newItem, price: value === '' ? 0 : parseFloat(value) || 0});
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="item-prep-time" className="block text-sm font-semibold text-gray-700 mb-2">Tiempo (min)</label>
                          <input
                            id="item-prep-time"
                            type="number"
                            placeholder="15"
                            value={newItem.preparationTime}
                            onChange={(e) => setNewItem({...newItem, preparationTime: parseInt(e.target.value) || 10})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <Package className="w-5 h-5 text-red-600" />
                      <span>Categoría</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {state.categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewItem({...newItem, category: cat})}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            newItem.category === cat
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(cat)}
                            <span className="text-sm font-medium">{cat}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <Edit className="w-5 h-5 text-red-600" />
                      <span>Descripción</span>
                    </h4>
                    <textarea
                      id="item-description"
                      placeholder="Describe los ingredientes y características del plato..."
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                      rows={5}
                    />
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <Star className="w-5 h-5 text-red-600" />
                      <span>Características</span>
                    </h4>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newItem.isSpicy}
                          onChange={(e) => setNewItem({...newItem, isSpicy: e.target.checked})}
                          className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">🌶️</span>
                          <div>
                            <div className="font-medium text-gray-800">Picante</div>
                            <div className="text-sm text-gray-600">Contiene ají o especias picantes</div>
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newItem.isVegetarian}
                          onChange={(e) => setNewItem({...newItem, isVegetarian: e.target.checked})}
                          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">🌱</span>
                          <div>
                            <div className="font-medium text-gray-800">Vegetariano</div>
                            <div className="text-sm text-gray-600">Sin ingredientes de origen animal</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowNewItemForm(false);
                    setEditingItem(null);
                    setNewItem({
                      name: '',
                      price: 0,
                      category: state.categories.length > 0 ? state.categories[0] : '',
                      description: '',
                      preparationTime: 10,
                      isSpicy: false,
                      isVegetarian: false
                    });
                  }}
                  className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.name || newItem.price <= 0}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                >
                  {editingItem ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingItem ? 'Guardar Cambios' : 'Agregar Producto'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuManagement;