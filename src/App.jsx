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
  Building2,
  Users,
  Home,
  DollarSign,
  Printer,
  Calendar,
  Droplets,
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
  setDoc,
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
  const [searchTerm, setSearchTerm] = useState("");

  // Kat Planı State'leri
  const [activeTab, setActiveTab] = useState("transactions");
  const [apartments, setApartments] = useState({});
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [newResident, setNewResident] = useState("");
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [apartmentsLoading, setApartmentsLoading] = useState(true);

  // Aidat State'leri
  const [aidatPayments, setAidatPayments] = useState({});
  const [selectedAidatMonth, setSelectedAidatMonth] = useState(
    new Date().getMonth() + 1,
  );
  const [selectedAidatYear, setSelectedAidatYear] = useState(
    new Date().getFullYear(),
  );
  const [showMakbuzModal, setShowMakbuzModal] = useState(false);
  const [selectedMakbuz, setSelectedMakbuz] = useState(null);
  const AIDAT_AMOUNT = 750;

  // Hidrofor State'leri
  const [hidroforPayments, setHidroforPayments] = useState({});
  const [hidroforLoading, setHidroforLoading] = useState(true);
  const [selectedHidroforYear, setSelectedHidroforYear] = useState(
    new Date().getFullYear(),
  );
  const HIDROFOR_TAKSIT_AMOUNT = 7000;

  // Yazdırma State'i (hangi bölüm yazdırılacak)
  const [printTarget, setPrintTarget] = useState(null);

  const floorConfig = [2, 4, 4, 4, 4, 4, 2];

  const getDaireNo = (floor, apt) => {
    let daireNo = 0;
    for (let f = 1; f < floor; f++) {
      daireNo += floorConfig[f - 1];
    }
    return daireNo + apt;
  };

  const getFloorLabel = (floor) => {
    if (floor === 1) return "Zemin Kat";
    return `${floor}. Kat`;
  };

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

  // Firebase'den işlemleri dinle
  useEffect(() => {
    const q = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc"),
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
      },
    );

    return () => unsubscribe();
  }, []);

  // Firebase'den daire sakinlerini dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "apartments", "residents"),
      (docSnap) => {
        if (docSnap.exists()) {
          setApartments(docSnap.data());
        } else {
          const initial = {};
          for (let floor = 1; floor <= 7; floor++) {
            const apartmentCount = floorConfig[floor - 1];
            for (let apt = 1; apt <= apartmentCount; apt++) {
              initial[`${floor}-${apt}`] = [];
            }
          }
          setApartments(initial);
        }
        setApartmentsLoading(false);
      },
      (error) => {
        console.error("Daire verileri alınırken hata:", error);
        setApartmentsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Firebase'den aidat ödemelerini dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "aidatPayments", "monthly"),
      (docSnap) => {
        if (docSnap.exists()) {
          setAidatPayments(docSnap.data());
        } else {
          setAidatPayments({});
        }
      },
      (error) => {
        console.error("Aidat verileri alınırken hata:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  // Firebase'den hidrofor ödemelerini dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "hidroforPayments", "yearly"),
      (docSnap) => {
        if (docSnap.exists()) {
          setHidroforPayments(docSnap.data());
        } else {
          setHidroforPayments({});
        }
        setHidroforLoading(false);
      },
      (error) => {
        console.error("Hidrofor verileri alınırken hata:", error);
        setHidroforLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Yazdırma hedefi değiştiğinde body'e attribute ekle ve yazdırma diyaloğunu tetikle
  useEffect(() => {
    if (printTarget) {
      document.body.setAttribute("data-print-mode", printTarget);
      const timer = setTimeout(() => {
        window.print();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      document.body.removeAttribute("data-print-mode");
    }
  }, [printTarget]);

  // Yazdırma tamamlandığında (veya iptal edildiğinde) hedefi sıfırla
  useEffect(() => {
    const handleAfterPrint = () => setPrintTarget(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
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
    } else if (
      loginData.username === "necatiarslan" &&
      loginData.password === "necati123"
    ) {
      setUser({ username: "necatiarslan", role: "admin" });
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
        transactionData,
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
    const shouldDelete = window.confirm(
      "Bu işlemi silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.",
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

  const handleAddResident = async () => {
    if (!selectedApartment || !newResident.trim()) {
      showNotification("Lütfen daire seçin ve sakin adı girin!", "warning");
      return;
    }

    try {
      const updatedApartments = {
        ...apartments,
        [selectedApartment]: [
          ...(apartments[selectedApartment] || []),
          newResident.trim(),
        ],
      };

      await setDoc(doc(db, "apartments", "residents"), updatedApartments);

      setNewResident("");
      setShowResidentModal(false);
      showNotification("Sakin başarıyla eklendi!", "success");
    } catch (error) {
      console.error("Sakin eklenirken hata:", error);
      showNotification("Sakin eklenirken bir hata oluştu!", "error");
    }
  };

  const handleRemoveResident = async (aptKey, residentIndex) => {
    if (!user?.role === "admin") return;

    const shouldDelete = window.confirm(
      "Bu sakini silmek istediğinizden emin misiniz?",
    );
    if (!shouldDelete) return;

    try {
      const updatedResidents = apartments[aptKey].filter(
        (_, i) => i !== residentIndex,
      );
      const updatedApartments = {
        ...apartments,
        [aptKey]: updatedResidents,
      };

      await setDoc(doc(db, "apartments", "residents"), updatedApartments);
      showNotification("Sakin başarıyla silindi!", "success");
    } catch (error) {
      console.error("Sakin silinirken hata:", error);
      showNotification("Sakin silinirken bir hata oluştu!", "error");
    }
  };

  // Aidat ödeme kaydet
  const handleAidatPayment = async (daireKey, paid) => {
    if (!user?.role === "admin") return;

    try {
      const monthKey = `${selectedAidatYear}-${String(selectedAidatMonth).padStart(2, "0")}`;
      const updatedPayments = {
        ...aidatPayments,
        [monthKey]: {
          ...(aidatPayments[monthKey] || {}),
          [daireKey]: {
            paid,
            paymentDate: new Date().toISOString(),
            amount: AIDAT_AMOUNT,
            paidBy: user.username,
          },
        },
      };

      await setDoc(doc(db, "aidatPayments", "monthly"), updatedPayments);
      showNotification(
        paid ? "Aidat ödemesi kaydedildi!" : "Aidat ödemesi iptal edildi!",
        "success",
      );
    } catch (error) {
      console.error("Aidat kaydedilirken hata:", error);
      showNotification("Aidat kaydedilirken hata oluştu!", "error");
    }
  };

  // Hidrofor taksit ödeme kaydet
  const handleHidroforPayment = async (aptKey, taksit, paid) => {
    if (user?.role !== "admin") return;

    try {
      const yearKey = `${selectedHidroforYear}`;
      const currentYearData = hidroforPayments[yearKey] || {};
      const currentAptData = currentYearData[aptKey] || {};
      const updatedPayments = {
        ...hidroforPayments,
        [yearKey]: {
          ...currentYearData,
          [aptKey]: {
            ...currentAptData,
            [taksit]: {
              paid,
              paymentDate: new Date().toISOString(),
              amount: HIDROFOR_TAKSIT_AMOUNT,
              paidBy: user.username,
            },
          },
        },
      };

      await setDoc(doc(db, "hidroforPayments", "yearly"), updatedPayments);
      showNotification(
        paid
          ? "Hidrofor ödemesi kaydedildi!"
          : "Hidrofor ödemesi iptal edildi!",
        "success",
      );
    } catch (error) {
      console.error("Hidrofor kaydedilirken hata:", error);
      showNotification("Hidrofor kaydedilirken hata oluştu!", "error");
    }
  };

  const handleShowMakbuz = (daireNo, residents, payment, aptKey) => {
    const monthKey = `${selectedAidatYear}-${String(selectedAidatMonth).padStart(2, "0")}`;
    const monthPayments = aidatPayments[monthKey] || {};
    const paymentData = monthPayments[aptKey];

    setSelectedMakbuz({
      daireNo,
      residents: residents.join(", ") || "Boş Daire",
      amount: AIDAT_AMOUNT,
      paymentDate: paymentData?.paymentDate
        ? new Date(paymentData.paymentDate).toLocaleDateString("tr-TR")
        : "-",
      month: months[selectedAidatMonth - 1],
      year: selectedAidatYear,
    });
    setShowMakbuzModal(true);
  };

  const printMakbuz = () => {
    setPrintTarget("makbuz");
  };

  const printAidatList = () => {
    setPrintTarget("aidat");
  };

  const printTransactions = () => {
    setPrintTarget("transactions");
  };

  const printHidrofor = () => {
    setPrintTarget("hidrofor");
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.month === selectedMonth &&
      t.year === selectedYear &&
      (t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm)),
  );

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const cumulativeTransactions = transactions.filter(
    (t) =>
      t.year < selectedYear ||
      (t.year === selectedYear && t.month <= selectedMonth),
  );

  const cumulativeIncome = cumulativeTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const cumulativeExpense = cumulativeTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netTotal = cumulativeIncome - cumulativeExpense;

  const totalResidents = Object.values(apartments).flat().length;
  const totalApartments = 24;
  const occupiedApartments = Object.values(apartments).filter(
    (r) => r.length > 0,
  ).length;
  const emptyApartments = totalApartments - occupiedApartments;

  if (loading || apartmentsLoading || hidroforLoading) {
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
      {/* Yazdırma için genel stil: sadece seçilen bölüm yazdırılır, boş sayfa oluşmaz */}
      <style>{`
  @media print {
    @page {
      size: A4;
      margin: 10mm;
    }

    html,
    body,
    #root {
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }

    /* GENEL YAZDIRMA MODU */
    body[data-print-mode] button,
    body[data-print-mode] .print\\:hidden {
      display: none !important;
    }

    /* MAKBUZ YAZDIRMA - BOŞ SAYFA ENGELİ */
    body[data-print-mode="makbuz"] #root > div > *:not(.makbuz-modal) {
      display: none !important;
    }

    body[data-print-mode="makbuz"] .makbuz-modal {
      position: static !important;
      inset: auto !important;
      display: block !important;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      height: auto !important;
      min-height: 0 !important;
    }

    body[data-print-mode="makbuz"] .makbuz-modal > div {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      background: white !important;
    }

    body[data-print-mode="makbuz"] .makbuz-modal > div > :not(.makbuz-content) {
      display: none !important;
    }

    body[data-print-mode="makbuz"] .makbuz-content {
      display: block !important;
      visibility: visible !important;
      position: static !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: white !important;
    }

    body[data-print-mode="makbuz"] .makbuz-content * {
      visibility: visible !important;
    }

    body[data-print-mode="makbuz"] .makbuz-content > div {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin: 0 !important;
    }

    /* GELİR/GİDER YAZDIRMA */
    body[data-print-mode="transactions"] * {
      visibility: hidden !important;
    }

    body[data-print-mode="transactions"] .transactions-print-content,
    body[data-print-mode="transactions"] .transactions-print-content * {
      visibility: visible !important;
    }

    body[data-print-mode="transactions"] .transactions-print-content {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
    }

    /* AİDAT LİSTESİ YAZDIRMA */
    body[data-print-mode="aidat"] * {
      visibility: hidden !important;
    }

    body[data-print-mode="aidat"] .aidat-print-content,
    body[data-print-mode="aidat"] .aidat-print-content * {
      visibility: visible !important;
    }

    body[data-print-mode="aidat"] .aidat-print-content {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
    }

    /* HİDROFOR YAZDIRMA */
    body[data-print-mode="hidrofor"] * {
      visibility: hidden !important;
    }

    body[data-print-mode="hidrofor"] .hidrofor-print-content,
    body[data-print-mode="hidrofor"] .hidrofor-print-content * {
      visibility: visible !important;
    }

    body[data-print-mode="hidrofor"] .hidrofor-print-content {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
    }
  }
`}</style>

      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 bg-white min-w-80 max-w-md transform transition-all duration-300 ease-in-out ${
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

            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Canlı Veriler</span>
              </div>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white rounded-lg shadow-md p-1 inline-flex flex-wrap">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeTab === "transactions"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Gelir/Gider
          </button>
          <button
            onClick={() => setActiveTab("floorplan")}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeTab === "floorplan"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Kat Planı
          </button>
          <button
            onClick={() => setActiveTab("aidat")}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeTab === "aidat"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Aidat Takibi
          </button>
          <button
            onClick={() => setActiveTab("hidrofor")}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeTab === "hidrofor"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Droplets className="h-4 w-4 mr-2" />
            Hidrofor
          </button>
        </div>
      </div>
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

            <div className="mt-6">
              <button
                onClick={() => setShowAccountInfo(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Hesap Bilgisi
              </button>
            </div>

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
                  <span>Toplam Sakin</span>
                  <span className="font-semibold">{totalResidents}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded text-sm">
                  <span>Boş Daire</span>
                  <span className="font-semibold">{emptyApartments}</span>
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
                      <span className="text-sm font-semibold">VAKIFBANK</span>
                      <button
                        onClick={() =>
                          copyToClipboard("VAKIFBANK", "Banka adı")
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
                        TR76 0001 5001 5800 7366 4929 51
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            "TR76 0001 5001 5800 7366 4929 51",
                            "IBAN",
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
                      <span className="text-sm font-semibold">
                        NECATİ ARSLAN
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard("NECATİ ARSLAN", "Hesap adı")
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
        {activeTab === "transactions" ? (
          <>
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
                      onChange={(e) =>
                        setSelectedMonth(parseInt(e.target.value))
                      }
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
                      onChange={(e) =>
                        setSelectedYear(parseInt(e.target.value))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ara (isim veya tutar)
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Açıklama veya tutara göre ara..."
                  />
                </div>

                <div className="mt-4 sm:mt-0 flex items-center gap-2">
                  <button
                    onClick={printTransactions}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Yazdır
                  </button>
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
            </div>

            <div className="transactions-print-content">
              {/* Yazdırma başlığı (sadece yazdırırken görünür) */}
              <div className="hidden print:block mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  İdris Bey Apartmanı
                </h1>
                <h2 className="text-xl text-gray-700">
                  {months[selectedMonth - 1]} {selectedYear} - Gelir Gider
                  Listesi
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Yazdırma Tarihi: {new Date().toLocaleDateString("tr-TR")}
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:mb-4">
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Toplam Gelir
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    ₺{totalIncome.toLocaleString("tr-TR")}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {
                      filteredTransactions.filter((t) => t.type === "income")
                        .length
                    }{" "}
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
                    {
                      filteredTransactions.filter((t) => t.type === "expense")
                        .length
                    }{" "}
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
                <div className="px-6 py-4 border-b print:border-b-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {months[selectedMonth - 1]} {selectedYear} - İşlemler
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  {filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p className="text-lg mb-2">
                        Bu ay için kayıt bulunamadı.
                      </p>
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
                      <thead className="bg-gray-50 print:bg-gray-100">
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
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                              İşlemler
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="hover:bg-gray-50 print:hover:bg-white"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString(
                                "tr-TR",
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {transaction.description}
                              {transaction.addedBy && (
                                <p className="text-xs text-gray-500 mt-1 print:hidden">
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
                                {transaction.type === "income"
                                  ? "Gelir"
                                  : "Gider"}
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
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium print:hidden">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleEditTransaction(transaction)
                                    }
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
            </div>
          </>
        ) : activeTab === "floorplan" ? (
          /* Kat Planı Görünümü */
          <div>
            {/* Admin için Sakin Ekleme Paneli */}
            {user?.role === "admin" && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Sakin Ekle
                </h2>
                <div className="flex flex-wrap gap-3 items-center">
                  <select
                    value={selectedApartment || ""}
                    onChange={(e) => setSelectedApartment(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Daire Seçin</option>
                    {[...Array(7)].map((_, floorIdx) => {
                      const floor = 7 - floorIdx;
                      const aptCount = floorConfig[floor - 1];
                      return [...Array(aptCount)].map((_, aptIdx) => (
                        <option
                          key={`${floor}-${aptIdx + 1}`}
                          value={`${floor}-${aptIdx + 1}`}
                        >
                          {getFloorLabel(floor)} - Daire{" "}
                          {getDaireNo(floor, aptIdx + 1)}
                        </option>
                      ));
                    })}
                  </select>
                  <input
                    type="text"
                    value={newResident}
                    onChange={(e) => setNewResident(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddResident()}
                    placeholder="Sakin adı..."
                    className="flex-1 min-w-48 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddResident}
                    disabled={!selectedApartment || !newResident.trim()}
                    className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlusCircle className="h-4 w-4 inline mr-2" />
                    Ekle
                  </button>
                </div>
              </div>
            )}

            {/* Apartman Bilgileri */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Toplam Kat</p>
                    <p className="text-2xl font-bold text-gray-900">7</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <Home className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Toplam Daire</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Toplam Sakin</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalResidents}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
                <div className="flex items-center">
                  <Home className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Boş Daire</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {emptyApartments}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bina Görünümü */}
            <div className="bg-amber-800 p-4 rounded-t-3xl shadow-2xl">
              {/* Çatı */}
              <div className="bg-red-700 h-10 rounded-t-3xl mb-3 flex items-center justify-center">
                <span className="text-white font-bold">🏠 ÇATI</span>
              </div>

              {/* Katlar */}
              {[...Array(7)].map((_, floorIdx) => {
                const floor = 7 - floorIdx;
                const apartmentCount = floorConfig[floor - 1];
                const isSpecialFloor = apartmentCount === 2;

                return (
                  <div key={floor} className="mb-3">
                    {/* Kat Etiketi */}
                    <div className="flex items-center mb-2">
                      <div className="bg-amber-600 text-white text-sm font-bold px-3 py-1 rounded">
                        {getFloorLabel(floor)}
                      </div>
                    </div>

                    {/* Daireler */}
                    <div
                      className={`grid gap-3 ${
                        isSpecialFloor ? "grid-cols-2" : "grid-cols-4"
                      }`}
                    >
                      {[...Array(apartmentCount)].map((_, aptIdx) => {
                        const aptKey = `${floor}-${aptIdx + 1}`;
                        const residents = apartments[aptKey] || [];
                        const isSelected = selectedApartment === aptKey;
                        const daireNo = getDaireNo(floor, aptIdx + 1);

                        return (
                          <div
                            key={aptKey}
                            onClick={() =>
                              user?.role === "admin" &&
                              setSelectedApartment(aptKey)
                            }
                            className={`
                              bg-gradient-to-b from-gray-100 to-gray-200 
                              rounded-lg p-3 min-h-32 
                              border-4 transition-all duration-200
                              ${user?.role === "admin" ? "cursor-pointer" : "cursor-default"}
                              ${
                                isSelected
                                  ? "border-indigo-500 shadow-lg scale-105"
                                  : "border-gray-400 hover:border-indigo-300"
                              }
                            `}
                          >
                            {/* Kapı */}
                            <div className="flex justify-center mb-2">
                              <div className="w-8 h-10 bg-amber-700 rounded-t-lg relative">
                                <div className="absolute right-1.5 top-4 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                              </div>
                            </div>

                            {/* Daire Numarası */}
                            <div className="text-center text-sm font-bold text-gray-700 mb-2">
                              D.{daireNo}
                            </div>

                            {/* Sakinler */}
                            <div className="space-y-1">
                              {residents.length === 0 ? (
                                <div className="text-xs text-gray-400 text-center italic">
                                  Boş
                                </div>
                              ) : (
                                residents.map((resident, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between bg-blue-100 rounded px-2 py-1 group"
                                  >
                                    <span className="text-xs text-gray-700 truncate">
                                      👤 {resident}
                                    </span>
                                    {user?.role === "admin" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveResident(aptKey, idx);
                                        }}
                                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Zemin */}
            <div className="bg-gray-600 h-8 rounded-b-lg flex items-center justify-center">
              <span className="text-gray-300 text-sm">🚪 GİRİŞ</span>
            </div>

            {/* Sakin Listesi */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Sakin Listesi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(apartments)
                  .filter(([_, residents]) => residents.length > 0)
                  .sort((a, b) => {
                    const [floorA, aptA] = a[0].split("-").map(Number);
                    const [floorB, aptB] = b[0].split("-").map(Number);
                    const daireA = getDaireNo(floorA, aptA);
                    const daireB = getDaireNo(floorB, aptB);
                    return daireA - daireB;
                  })
                  .map(([key, residents]) => {
                    const [floor, apt] = key.split("-").map(Number);
                    const daireNo = getDaireNo(floor, apt);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border"
                      >
                        <span className="font-medium text-indigo-600 whitespace-nowrap">
                          D.{daireNo}:
                        </span>
                        <span className="text-gray-700 truncate">
                          {residents.join(", ")}
                        </span>
                      </div>
                    );
                  })}
              </div>
              {Object.values(apartments).flat().length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Henüz kayıtlı sakin bulunmuyor.
                </p>
              )}
            </div>

            {/* Bilgi Notu */}
            {!user && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Sakin eklemek veya silmek için yönetici girişi yapmanız
                  gerekmektedir.
                </p>
              </div>
            )}
          </div>
        ) : activeTab === "aidat" ? (
          /* Aidat Takibi Görünümü */
          <div>
            {/* Filtreler ve Yazdır */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ay
                    </label>
                    <select
                      value={selectedAidatMonth}
                      onChange={(e) =>
                        setSelectedAidatMonth(parseInt(e.target.value))
                      }
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
                      value={selectedAidatYear}
                      onChange={(e) =>
                        setSelectedAidatYear(parseInt(e.target.value))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={printAidatList}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Yazdır
                </button>
              </div>
            </div>

            <div className="aidat-print-content">
              {/* Aidat Özet Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:mb-4">
                {(() => {
                  const monthKey = `${selectedAidatYear}-${String(selectedAidatMonth).padStart(2, "0")}`;
                  const monthPayments = aidatPayments[monthKey] || {};
                  const paidCount = Object.values(monthPayments).filter(
                    (p) => p.paid,
                  ).length;
                  const unpaidCount = 24 - paidCount;
                  const totalCollected = paidCount * AIDAT_AMOUNT;
                  const totalPending = unpaidCount * AIDAT_AMOUNT;

                  return (
                    <>
                      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                        <div className="flex items-center">
                          <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Ödenen</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {paidCount}/24
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                        <div className="flex items-center">
                          <XCircle className="h-8 w-8 text-red-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Ödenmedi</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {unpaidCount}/24
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-blue-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Toplanan</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ₺{totalCollected.toLocaleString("tr-TR")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-orange-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Bekleyen</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ₺{totalPending.toLocaleString("tr-TR")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Aidat Listesi Başlık (Yazdırma için) */}
              <div className="hidden print:block mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  İdris Bey Apartmanı
                </h1>
                <h2 className="text-xl text-gray-700">
                  {months[selectedAidatMonth - 1]} {selectedAidatYear} - Aidat
                  Listesi
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Yazdırma Tarihi: {new Date().toLocaleDateString("tr-TR")}
                </p>
              </div>

              {/* Aidat Tablosu */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b print:border-b-2">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    {months[selectedAidatMonth - 1]} {selectedAidatYear} - Aidat
                    Listesi
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 print:bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Daire No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sakin Adı
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aidat Tutarı
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ödeme Tarihi
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                          İşlemler
                        </th>
                        <th className="hidden print:table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ödendi/Ödenmedi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        const monthKey = `${selectedAidatYear}-${String(selectedAidatMonth).padStart(2, "0")}`;
                        const monthPayments = aidatPayments[monthKey] || {};
                        const allApartments = [];

                        // Tüm daireleri sıralı bir şekilde oluştur
                        for (let floor = 1; floor <= 7; floor++) {
                          const apartmentCount = floorConfig[floor - 1];
                          for (let apt = 1; apt <= apartmentCount; apt++) {
                            const aptKey = `${floor}-${apt}`;
                            const daireNo = getDaireNo(floor, apt);
                            const residents = apartments[aptKey] || [];
                            const payment = monthPayments[aptKey];

                            allApartments.push({
                              daireNo,
                              aptKey,
                              residents,
                              payment,
                            });
                          }
                        }

                        return allApartments.map(
                          ({ daireNo, aptKey, residents, payment }) => (
                            <tr
                              key={aptKey}
                              className="hover:bg-gray-50 print:hover:bg-white"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                Daire {daireNo}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {residents.length > 0 ? (
                                  residents.join(", ")
                                ) : (
                                  <span className="text-gray-400 italic">
                                    Boş
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                ₺{AIDAT_AMOUNT.toLocaleString("tr-TR")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                {payment?.paid && payment?.paymentDate ? (
                                  <div className="flex items-center justify-center">
                                    <Calendar className="h-4 w-4 mr-1 text-green-600" />
                                    {new Date(
                                      payment.paymentDate,
                                    ).toLocaleDateString("tr-TR")}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center print:hidden">
                                <div className="flex items-center justify-center space-x-3">
                                  {user?.role === "admin" && (
                                    <input
                                      type="checkbox"
                                      checked={payment?.paid || false}
                                      onChange={(e) =>
                                        handleAidatPayment(
                                          aptKey,
                                          e.target.checked,
                                        )
                                      }
                                      className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                    />
                                  )}

                                  {!user?.role && (
                                    <span
                                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                        payment?.paid
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {payment?.paid ? "Ödendi" : "Ödenmedi"}
                                    </span>
                                  )}

                                  {payment?.paid && (
                                    <button
                                      onClick={() =>
                                        handleShowMakbuz(
                                          daireNo,
                                          residents,
                                          payment,
                                          aptKey,
                                        )
                                      }
                                      className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
                                      title="Makbuz Görüntüle"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      Makbuz
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="hidden print:table-cell px-6 py-4 whitespace-nowrap text-center text-sm">
                                {payment?.paid ? "✓ Ödendi" : "✗ Ödenmedi"}
                              </td>
                            </tr>
                          ),
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bilgi Notu */}
            {!user && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 print:hidden">
                <p className="text-sm text-blue-700 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Aidat ödemelerini işaretlemek için yönetici girişi yapmanız
                  gerekmektedir.
                </p>
              </div>
            )}
          </div>
        ) : activeTab === "hidrofor" ? (
          /* Hidrofor Takibi Görünümü */
          <div>
            {/* Filtreler ve Yazdır */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yıl
                  </label>
                  <select
                    value={selectedHidroforYear}
                    onChange={(e) =>
                      setSelectedHidroforYear(parseInt(e.target.value))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>

                <button
                  onClick={printHidrofor}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Yazdır
                </button>
              </div>
            </div>

            <div className="hidrofor-print-content">
              {/* Hidrofor Özet Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:mb-4">
                {(() => {
                  const yearKey = `${selectedHidroforYear}`;
                  const yearData = hidroforPayments[yearKey] || {};
                  const taksit1PaidCount = Object.values(yearData).filter(
                    (p) => p.taksit1?.paid,
                  ).length;
                  const taksit2PaidCount = Object.values(yearData).filter(
                    (p) => p.taksit2?.paid,
                  ).length;
                  const totalCollected =
                    (taksit1PaidCount + taksit2PaidCount) *
                    HIDROFOR_TAKSIT_AMOUNT;
                  const totalPending =
                    (48 - taksit1PaidCount - taksit2PaidCount) *
                    HIDROFOR_TAKSIT_AMOUNT;

                  return (
                    <>
                      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                        <div className="flex items-center">
                          <CheckCircle className="h-8 w-8 text-blue-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">
                              1. Taksit Ödenen
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {taksit1PaidCount}/24
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
                        <div className="flex items-center">
                          <CheckCircle className="h-8 w-8 text-indigo-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">
                              2. Taksit Ödenen
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {taksit2PaidCount}/24
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-green-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Toplanan</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ₺{totalCollected.toLocaleString("tr-TR")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-orange-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Bekleyen</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ₺{totalPending.toLocaleString("tr-TR")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Yazdırma başlığı (sadece yazdırırken görünür) */}
              <div className="hidden print:block mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  İdris Bey Apartmanı
                </h1>
                <h2 className="text-xl text-gray-700">
                  {selectedHidroforYear} - Hidrofor Ödeme Listesi
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Yazdırma Tarihi: {new Date().toLocaleDateString("tr-TR")}
                </p>
              </div>

              {/* Hidrofor Tablosu */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b print:border-b-2">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Droplets className="h-5 w-5 mr-2" />
                    {selectedHidroforYear} - Hidrofor Ödeme Listesi
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 print:bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Daire No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sakin Adı
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          1. Taksit (₺{HIDROFOR_TAKSIT_AMOUNT})
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          2. Taksit (₺{HIDROFOR_TAKSIT_AMOUNT})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        const yearKey = `${selectedHidroforYear}`;
                        const yearData = hidroforPayments[yearKey] || {};
                        const allApartments = [];

                        for (let floor = 1; floor <= 7; floor++) {
                          const apartmentCount = floorConfig[floor - 1];
                          for (let apt = 1; apt <= apartmentCount; apt++) {
                            const aptKey = `${floor}-${apt}`;
                            const daireNo = getDaireNo(floor, apt);
                            const residents = apartments[aptKey] || [];
                            const payment = yearData[aptKey];
                            allApartments.push({
                              daireNo,
                              aptKey,
                              residents,
                              payment,
                            });
                          }
                        }

                        return allApartments.map(
                          ({ daireNo, aptKey, residents, payment }) => (
                            <tr
                              key={aptKey}
                              className="hover:bg-gray-50 print:hover:bg-white"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                Daire {daireNo}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {residents.length > 0 ? (
                                  residents.join(", ")
                                ) : (
                                  <span className="text-gray-400 italic">
                                    Boş
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {user?.role === "admin" ? (
                                    <input
                                      type="checkbox"
                                      checked={payment?.taksit1?.paid || false}
                                      onChange={(e) =>
                                        handleHidroforPayment(
                                          aptKey,
                                          "taksit1",
                                          e.target.checked,
                                        )
                                      }
                                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer print:hidden"
                                    />
                                  ) : (
                                    <span
                                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full print:hidden ${
                                        payment?.taksit1?.paid
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {payment?.taksit1?.paid
                                        ? "Ödendi"
                                        : "Ödenmedi"}
                                    </span>
                                  )}
                                  <span className="hidden print:inline text-xs">
                                    {payment?.taksit1?.paid
                                      ? "✓ Ödendi"
                                      : "✗ Ödenmedi"}
                                  </span>
                                  {payment?.taksit1?.paid &&
                                    payment?.taksit1?.paymentDate && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          payment.taksit1.paymentDate,
                                        ).toLocaleDateString("tr-TR")}
                                      </span>
                                    )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {user?.role === "admin" ? (
                                    <input
                                      type="checkbox"
                                      checked={payment?.taksit2?.paid || false}
                                      onChange={(e) =>
                                        handleHidroforPayment(
                                          aptKey,
                                          "taksit2",
                                          e.target.checked,
                                        )
                                      }
                                      className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer print:hidden"
                                    />
                                  ) : (
                                    <span
                                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full print:hidden ${
                                        payment?.taksit2?.paid
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {payment?.taksit2?.paid
                                        ? "Ödendi"
                                        : "Ödenmedi"}
                                    </span>
                                  )}
                                  <span className="hidden print:inline text-xs">
                                    {payment?.taksit2?.paid
                                      ? "✓ Ödendi"
                                      : "✗ Ödenmedi"}
                                  </span>
                                  {payment?.taksit2?.paid &&
                                    payment?.taksit2?.paymentDate && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          payment.taksit2.paymentDate,
                                        ).toLocaleDateString("tr-TR")}
                                      </span>
                                    )}
                                </div>
                              </td>
                            </tr>
                          ),
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bilgi Notu */}
            {!user && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 print:hidden">
                <p className="text-sm text-blue-700 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Hidrofor ödemelerini işaretlemek için yönetici girişi yapmanız
                  gerekmektedir.
                </p>
              </div>
            )}
          </div>
        ) : null}
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
      {/* Makbuz Modal */}
      {showMakbuzModal && selectedMakbuz && (
        <div className="makbuz-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8">
            {/* Modal Header - Always Visible */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                Tahsilat Makbuzu
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={printMakbuz}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Yazdır</span>
                </button>
                <button
                  onClick={() => setShowMakbuzModal(false)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white border border-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Makbuz Content */}
            <div className="p-4 sm:p-8 makbuz-content">
              <div className="border-4 border-gray-800 rounded-lg p-4 sm:p-6 bg-white">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-6 border-b-2 border-gray-300 pb-3 sm:pb-4">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    APARTMAN
                  </h1>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
                    TAHSİLAT MAKBUZU
                  </h2>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <div className="mb-2 sm:mb-3">
                      <label className="text-xs sm:text-sm text-gray-600">
                        Ödeme Yapanın
                      </label>
                      <div className="border-b border-dotted border-gray-400 pb-1">
                        <span className="font-semibold text-sm sm:text-base">
                          {selectedMakbuz.residents}
                        </span>
                      </div>
                    </div>
                    <div className="mb-2 sm:mb-3">
                      <label className="text-xs sm:text-sm text-gray-600">
                        Adı Soyadı
                      </label>
                      <div className="border-b border-dotted border-gray-400 pb-1">
                        <span className="font-semibold text-sm sm:text-base">
                          {selectedMakbuz.residents}
                        </span>
                      </div>
                    </div>
                    <div className="mb-2 sm:mb-3">
                      <label className="text-xs sm:text-sm text-gray-600">
                        Apartman Adı
                      </label>
                      <div className="border-b border-dotted border-gray-400 pb-1">
                        <span className="font-semibold text-sm sm:text-base">
                          İdris Bey Apartmanı
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-gray-600">
                        Daire No
                      </label>
                      <div className="border-b border-dotted border-gray-400 pb-1">
                        <span className="font-semibold text-sm sm:text-base">
                          Daire {selectedMakbuz.daireNo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="mb-2 sm:mb-3">
                      <label className="text-xs sm:text-sm text-gray-600">
                        Seri No
                      </label>
                      <div className="border-b border-dotted border-gray-400 pb-1">
                        <span className="font-semibold text-sm sm:text-base">
                          A-{selectedMakbuz.daireNo.toString().padStart(3, "0")}
                        </span>
                      </div>
                    </div>
                    <div className="mb-2 sm:mb-3">
                      <label className="text-xs sm:text-sm text-gray-600">
                        Sıra No
                      </label>
                      <div className="border-b border-dotted border-gray-400 pb-1">
                        <span className="font-semibold text-sm sm:text-base">
                          {selectedMakbuz.daireNo.toString().padStart(4, "0")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-gray-600">
                        Tarih
                      </label>
                      <div className="border-b border-dotted border-gray-400 pb-1">
                        <span className="font-semibold text-sm sm:text-base">
                          {selectedMakbuz.paymentDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Section */}
                <div className="mb-4 sm:mb-6">
                  <div className="border border-gray-800">
                    <div className="grid grid-cols-12 border-b border-gray-800 bg-gray-50">
                      <div className="col-span-6 border-r border-gray-800 p-2 text-center font-semibold text-xs sm:text-sm">
                        TAHSİL OLUNAN GELİRİN
                      </div>
                      <div className="col-span-3 border-r border-gray-800 p-2 text-center font-semibold text-xs sm:text-sm">
                        Ay ve Yıl
                      </div>
                      <div className="col-span-3 p-2 text-center font-semibold text-xs sm:text-sm">
                        TUTAR
                        <br />₺
                      </div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-gray-800">
                      <div className="col-span-6 border-r border-gray-800 p-2 text-center font-semibold text-xs sm:text-sm">
                        Nev'i
                      </div>
                      <div className="col-span-3 border-r border-gray-800 p-2 text-center text-xs sm:text-sm">
                        Ay ve Yıl
                      </div>
                      <div className="col-span-3 p-2"></div>
                    </div>

                    {/* Data Row */}
                    <div className="grid grid-cols-12 min-h-[80px] sm:min-h-[120px]">
                      <div className="col-span-6 border-r border-gray-800 p-2 sm:p-3">
                        <div className="font-semibold text-base sm:text-lg">
                          Aidat
                        </div>
                      </div>
                      <div className="col-span-3 border-r border-gray-800 p-2 sm:p-3 text-center">
                        <div className="font-semibold text-sm sm:text-base">
                          {selectedMakbuz.month} {selectedMakbuz.year}
                        </div>
                      </div>
                      <div className="col-span-3 p-2 sm:p-3 text-right">
                        <div className="font-bold text-base sm:text-lg">
                          ₺{selectedMakbuz.amount.toLocaleString("tr-TR")}
                        </div>
                      </div>
                    </div>

                    {/* Total Row */}
                    <div className="grid grid-cols-12 border-t-2 border-gray-800 bg-gray-50">
                      <div className="col-span-9 border-r border-gray-800 p-2 text-right font-bold text-sm sm:text-base">
                        Toplam
                      </div>
                      <div className="col-span-3 p-2 text-right font-bold text-base sm:text-lg">
                        ₺{selectedMakbuz.amount.toLocaleString("tr-TR")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mt-4 sm:mt-8">
                  <div>
                    <label className="text-xs sm:text-sm text-gray-600">
                      Yalnız
                    </label>
                    <div className="border-b border-dotted border-gray-400 pb-1 mb-1">
                      <span className="font-semibold text-sm sm:text-base capitalize">
                        Yediyüzelli Türk Lirası
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-600">
                      Yönetici
                    </label>
                    <div className="border-b border-dotted border-gray-400 pb-1 mb-1 text-center">
                      <span className="font-semibold text-sm sm:text-base">
                        İmza
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Close Button - Mobile Friendly */}
            <div className="p-4 border-t bg-gray-50 sticky bottom-0">
              <button
                onClick={() => setShowMakbuzModal(false)}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Kapat
              </button>
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
