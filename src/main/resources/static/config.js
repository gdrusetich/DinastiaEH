const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE = IS_LOCALHOST ? 'http://localhost:8081/api' : `${window.location.origin}/api`;


const API_PRODUCTS = `${API_BASE}/products`;
const API_CATEGORIES = `${API_BASE}/categories`;
const API_COCAT_GROUPS = `${API_BASE}/co-category-group`;
const API_PROPERTY_VALUES = `${API_BASE}/property-values`;

const FOLDER_SYSTEM = "/images";
const rutaWA = `${FOLDER_SYSTEM}/WhatsApp.png`;
const rutaDefault = `${FOLDER_SYSTEM}/default.jpg`;
