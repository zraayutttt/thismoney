import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Trash2, Download, FileText, PlusCircle, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import './index.css';

// Registrasi Komponen Chart
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function App() {
  // --- STATE MANAGEMENT ---
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('keuangan-pro-data');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Input States
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [filter, setFilter] = useState('monthly'); // Default lihat per bulan

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem('keuangan-pro-data', JSON.stringify(transactions));
  }, [transactions]);

  // --- ACTIONS ---
  const addTransaction = (e) => {
    e.preventDefault();
    if (!desc || !amount) return;
    const newTx = {
      id: Date.now(),
      desc,
      amount: parseFloat(amount),
      type,
      date: new Date().toISOString()
    };
    setTransactions([newTx, ...transactions]);
    setDesc('');
    setAmount('');
  };

  const deleteTransaction = (id) => {
    if(confirm('Hapus data ini?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  // --- DATA PROCESSING & FILTERING ---
  const getFilteredData = () => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (filter === 'all') return true;
      if (filter === 'daily') return tDate.toDateString() === now.toDateString();
      if (filter === 'monthly') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      if (filter === 'yearly') return tDate.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const filteredData = getFilteredData();
  
  // Hitung Total
  const totalIncome = filteredData.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredData.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  // Format Rupiah
  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // --- CHART CONFIGURATION ---
  const chartData = {
    labels: ['Pemasukan', 'Pengeluaran'],
    datasets: [
      {
        data: [totalIncome, totalExpense],
        backgroundColor: ['#10b981', '#ef4444'], // Hijau & Merah
        borderColor: ['#059669', '#dc2626'],
        borderWidth: 1,
      },
    ],
  };

  // --- EXPORT FUNCTIONS ---
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(t => ({
      Tanggal: new Date(t.date).toLocaleDateString('id-ID'),
      Keterangan: t.desc,
      Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Jumlah: t.amount
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Laporan_Keuangan_${filter}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Laporan Keuangan (${filter})`, 14, 15);
    doc.autoTable({
      head: [['Tanggal', 'Keterangan', 'Tipe', 'Jumlah']],
      body: filteredData.map(t => [
        new Date(t.date).toLocaleDateString('id-ID'),
        t.desc,
        t.type === 'income' ? 'Masuk' : 'Keluar',
        formatRp(t.amount)
      ]),
      startY: 20
    });
    doc.save(`Laporan_Keuangan_${filter}.pdf`);
  };

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <Wallet size={28} />
          <h1>FinansialPro</h1>
        </div>
        <div className="user-info">
          <span>Halo, User</span>
          <div className="avatar">U</div>
        </div>
      </header>

      <div className="main-content">
        {/* SIDEBAR / CONTROLS */}
        <aside className="sidebar">
          <div className="card input-card">
            <h3><PlusCircle size={18} /> Transaksi Baru</h3>
            <form onSubmit={addTransaction}>
              <div className="form-group">
                <label>Keterangan</label>
                <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Contoh: Gaji, Makan..." />
              </div>
              <div className="form-group">
                <label>Nominal (Rp)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Tipe</label>
                <div className="radio-group">
                  <label className={`radio-label ${type === 'income' ? 'active-inc' : ''}`}>
                    <input type="radio" name="type" value="income" checked={type === 'income'} onChange={() => setType('income')} /> Pemasukan
                  </label>
                  <label className={`radio-label ${type === 'expense' ? 'active-exp' : ''}`}>
                    <input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} /> Pengeluaran
                  </label>
                </div>
              </div>
              <button type="submit" className="btn-primary">Simpan Transaksi</button>
            </form>
          </div>

          <div className="card export-card">
            <h3>Export Laporan</h3>
            <div className="btn-group">
              <button onClick={exportExcel} className="btn-outline success"><FileText size={16}/> Excel</button>
              <button onClick={exportPDF} className="btn-outline danger"><Download size={16}/> PDF</button>
            </div>
          </div>
        </aside>

        {/* DASHBOARD AREA */}
        <main className="dashboard">
          {/* FILTER BAR */}
          <div className="filter-bar">
            <h2>Dashboard Ringkasan</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Semua Data</option>
              <option value="daily">Hari Ini</option>
              <option value="monthly">Bulan Ini</option>
              <option value="yearly">Tahun Ini</option>
            </select>
          </div>

          {/* SUMMARY CARDS */}
          <div className="stats-grid">
            <div className="stat-card balance">
              <div className="icon"><Wallet /></div>
              <div>
                <small>Saldo Saat Ini</small>
                <h2>{formatRp(balance)}</h2>
              </div>
            </div>
            <div className="stat-card income">
              <div className="icon"><TrendingUp /></div>
              <div>
                <small>Total Pemasukan</small>
                <h2>{formatRp(totalIncome)}</h2>
              </div>
            </div>
            <div className="stat-card expense">
              <div className="icon"><TrendingDown /></div>
              <div>
                <small>Total Pengeluaran</small>
                <h2>{formatRp(totalExpense)}</h2>
              </div>
            </div>
          </div>

          <div className="content-split">
            {/* GRAPHIC */}
            <div className="card chart-card">
              <h3>Statistik {filter === 'monthly' ? 'Bulanan' : ''}</h3>
              <div className="chart-container">
                {totalIncome === 0 && totalExpense === 0 ? 
                  <p className="no-data">Belum ada data grafik</p> : 
                  <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
                }
              </div>
            </div>

            {/* TABLE */}
            <div className="card table-card">
              <h3>Riwayat Transaksi</h3>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Keterangan</th>
                      <th>Nominal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr><td colSpan="4" className="text-center">Data kosong</td></tr>
                    ) : (
                      filteredData.map(t => (
                        <tr key={t.id}>
                          <td>{new Date(t.date).toLocaleDateString('id-ID')}</td>
                          <td>{t.desc}</td>
                          <td className={t.type === 'income' ? 'text-green' : 'text-red'}>
                            {t.type === 'income' ? '+' : '-'} {formatRp(t.amount)}
                          </td>
                          <td>
                            <button onClick={() => deleteTransaction(t.id)} className="btn-icon">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
