import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Menu,
  X,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  Loader2,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  CreditCard,
  Copy,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ApartmentManagement = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: "income",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Notification functions
  const showNotification = (message, type = "info", duration = 4000) => {
    const id = Date.now();
    const notification = { id, message, type };

    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showNotification(`${label} kopyalandı!`, "success");
      })
      .catch(() => {
        showNotification("Kopyalama başarısız!", "error");
      });
  };

  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  // Firebase'den verileri dinle
  useEffect(() => {
    const q = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const transactionsList = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          transactionsList.push({
            id: doc.id,
            ...data,
            date: data.date || new Date().toISOString().split("T")[0],
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        setTransactions(transactionsList);
        setLoading(false);
      },
      (error) => {
        console.error("Veriler alınırken hata:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    if (
      loginData.username === "mithatkara" &&
      loginData.password === "marcelo123"
    ) {
      setUser({ username: "mithatkara", role: "admin" });
      setShowLoginForm(false);
      setLoginData({ username: "", password: "" });
      setIsMenuOpen(false);
      showNotification("Başarıyla giriş yapıldı! Hoş geldiniz.", "success");
    } else {
      showNotification("Kullanıcı adı veya şifre hatalı!", "error");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsMenuOpen(false);
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingTransaction(null);
    showNotification("Başarıyla çıkış yapıldı.", "info");
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      showNotification("Lütfen tüm alanları doldurun!", "warning");
      return;
    }

    setAdding(true);

    try {
      const date = new Date(newTransaction.date);
      const transactionData = {
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        date: newTransaction.date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        addedBy: user?.username || "anonymous",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), transactionData);

      setNewTransaction({
        type: "income",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowAddForm(false);
      showNotification("İşlem başarıyla eklendi!", "success");
    } catch (error) {
      console.error("Işlem eklenirken hata:", error);
      showNotification("İşlem eklenirken bir hata oluştu!", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date,
    });
    setShowEditForm(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction.amount || !editingTransaction.description) {
      showNotification("Lütfen tüm alanları doldurun!", "warning");
      return;
    }

    setEditing(true);

    try {
      const date = new Date(editingTransaction.date);
      const transactionData = {
        type: editingTransaction.type,
        amount: parseFloat(editingTransaction.amount),
        description: editingTransaction.description,
        date: editingTransaction.date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        updatedBy: user?.username || "anonymous",
        updatedAt: serverTimestamp(),
      };

      await updateDoc(
        doc(db, "transactions", editingTransaction.id),
        transactionData
      );

      setEditingTransaction(null);
      setShowEditForm(false);
      showNotification("İşlem başarıyla güncellendi!", "success");
    } catch (error) {
      console.error("Işlem güncellenirken hata:", error);
      showNotification("İşlem güncellenirken bir hata oluştu!", "error");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    // Modern confirmation modal yerine
    const shouldDelete = window.confirm(
      "Bu işlemi silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz."
    );

    if (!shouldDelete) {
      return;
    }

    setDeleting(transactionId);

    try {
      await deleteDoc(doc(db, "transactions", transactionId));
      showNotification("İşlem başarıyla silindi!", "success");
    } catch (error) {
      console.error("Işlem silinirken hata:", error);
      showNotification("İşlem silinirken bir hata oluştu!", "error");
    } finally {
      setDeleting(null);
    }
  };

  const filteredTransactions = transactions.filter(
    (t) => t.month === selectedMonth && t.year === selectedYear
  );

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netTotal = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 bg-white min-w-80 max-w-md transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-5 ${
              notification.type === "success"
                ? "border-green-500"
                : notification.type === "error"
                ? "border-red-500"
                : notification.type === "warning"
                ? "border-yellow-500"
                : "border-blue-500"
            }`}
          >
            <div className="flex-shrink-0 mr-3">
              {notification.type === "success" && (
                <CheckCircle className="h-6 w-6 text-green-500" />
              )}
              {notification.type === "error" && (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              {notification.type === "warning" && (
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              )}
              {notification.type === "info" && (
                <Info className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  notification.type === "success"
                    ? "text-green-800"
                    : notification.type === "error"
                    ? "text-red-800"
                    : notification.type === "warning"
                    ? "text-yellow-800"
                    : "text-blue-800"
                }`}
              >
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">İB</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  İdris Bey Apartmanı
                </h1>
                <p className="text-sm text-gray-600">
                  Gelir Gider Takip Sistemi
                </p>
              </div>
            </div>

            {/* Online Status */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Canlı Veriler</span>
              </div>

              {/* Hamburger Menu */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Menu */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Menü</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 p-4">
            {!user ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 mb-2">💡 Bilgi</p>
                  <p className="text-xs text-blue-700">
                    Yönetici girişi yapmadınız. Sadece işlemleri
                    görüntüleyebilirsiniz.
                  </p>
                </div>
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Yönetici Girişi
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600">✅ Giriş Yapıldı</p>
                  <p className="font-semibold text-green-800">
                    {user.username}
                  </p>
                  <p className="text-xs text-green-600 capitalize">
                    ({user.role})
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </button>
              </div>
            )}

            {/* Hesap Bilgisi Butonu */}
            <div className="mt-6">
              <button
                onClick={() => setShowAccountInfo(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Hesap Bilgisi
              </button>
            </div>

            {/* Stats in Sidebar */}
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Toplam İstatistikler
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded text-sm">
                  <span>Toplam İşlem</span>
                  <span className="font-semibold">{transactions.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm">
                  <span>Bu Ay</span>
                  <span className="font-semibold">
                    {filteredTransactions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Modal */}
      {showAccountInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
                Hesap Bilgisi
              </h2>
              <button
                onClick={() => setShowAccountInfo(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banka Adı
                    </label>
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm font-semibold">
                        DENİZBANK A.Ş
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard("DENİZBANK A.Ş", "Banka adı")
                        }
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Kopyala"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IBAN
                    </label>
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm font-semibold">
                        TR970013400002471685800001
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            "TR97 0013 4000 0247 1685 8000 01",
                            "IBAN"
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Kopyala"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hesap Adı
                    </label>
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm font-semibold">MİTHAT KARA</span>
                      <button
                        onClick={() =>
                          copyToClipboard("MİTHAT KARA", "Hesap adı")
                        }
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Kopyala"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-xs text-yellow-700">
                  💡 Bilgileri kopyalamak için yanlarındaki kopyala butonlarını
                  kullanabilirsiniz.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowAccountInfo(false)}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Yönetici Girişi
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Kullanıcı adınızı giriniz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Şifrenizi giriniz"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleLogin}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => setShowLoginForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ay
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yıl
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>

            {user?.role === "admin" && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Yeni Kayıt
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Toplam Gelir
            </h3>
            <p className="text-3xl font-bold text-green-600">
              ₺{totalIncome.toLocaleString("tr-TR")}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {filteredTransactions.filter((t) => t.type === "income").length}{" "}
              işlem
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Toplam Gider
            </h3>
            <p className="text-3xl font-bold text-red-600">
              ₺{totalExpense.toLocaleString("tr-TR")}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {filteredTransactions.filter((t) => t.type === "expense").length}{" "}
              işlem
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Net Tutar
            </h3>
            <p
              className={`text-3xl font-bold ${
                netTotal >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₺{netTotal.toLocaleString("tr-TR")}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {netTotal >= 0 ? "Pozitif bakiye" : "Negatif bakiye"}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {months[selectedMonth - 1]} {selectedYear} - İşlemler
            </h2>
          </div>
          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">Bu ay için kayıt bulunamadı.</p>
                {user?.role === "admin" && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    İlk kaydı eklemek ister misiniz?
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutar
                    </th>
                    {user?.role === "admin" && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                        {transaction.addedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            Ekleyen: {transaction.addedBy}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.type === "income" ? "Gelir" : "Gider"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}₺
                        {transaction.amount.toLocaleString("tr-TR")}
                      </td>
                      {user?.role === "admin" && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteTransaction(transaction.id)
                              }
                              disabled={deleting === transaction.id}
                              className="text-red-600 hover:text-red-900 p-1 rounded transition-colors disabled:opacity-50"
                              title="Sil"
                            >
                              {deleting === transaction.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Yeni İşlem Ekle
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tip
                </label>
                <select
                  value={newTransaction.type}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="income">Gelir</option>
                  <option value="expense">Gider</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      amount: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="İşlem açıklaması..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAddTransaction}
                  disabled={adding}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    "Ekle"
                  )}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={adding}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditForm && editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              İşlem Düzenle
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tip
                </label>
                <select
                  value={editingTransaction.type}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="income">Gelir</option>
                  <option value="expense">Gider</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTransaction.amount}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      amount: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={editingTransaction.description}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="İşlem açıklaması..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateTransaction}
                  disabled={editing}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {editing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    "Güncelle"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingTransaction(null);
                  }}
                  disabled={editing}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default ApartmentManagement;
