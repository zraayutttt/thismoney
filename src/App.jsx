import { useState, useEffect } from 'react';
import './index.css';
import { Trash2 } from 'lucide-react';

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('keuangan-data');
    return saved ? JSON.parse(saved) : [];
  });

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('keuangan-data', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (e) => {
    e.preventDefault();
    if (!description || !amount) return;
    const newTransaction = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      type,
      date: new Date().toISOString(),
    };
    setTransactions([newTransaction, ...transactions]);
    setDescription('');
    setAmount('');
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (filter === 'all') return true;
      if (filter === 'daily') return tDate.toDateString() === now.toDateString();
      if (filter === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return tDate >= oneWeekAgo;
      }
      if (filter === 'monthly') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      if (filter === 'yearly') return tDate.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const filteredData = getFilteredTransactions();

  const calculateTotal = (type) => {
    return filteredData
      .filter(t => t.type === type)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const totalIncome = calculateTotal('income');
  const totalExpense = calculateTotal('expense');
  const balance = totalIncome - totalExpense;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  return (
    <div className="container">
      <h1>💰 Catatan Keuangan</h1>
      <div className="card">
        <h3>Tambah Transaksi</h3>
        <form onSubmit={addTransaction}>
          <input 
            type="text" 
            placeholder="Keterangan" 
            value={description}
            onChange={(e) => setDescription(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Jumlah (Rp)" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)} 
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
          <button type="submit" className="add-btn">Simpan</button>
        </form>
      </div>

      <div style={{marginBottom: '10px'}}>
        <label>Filter: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Semua</option>
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
          <option value="yearly">Tahunan</option>
        </select>
      </div>

      <div className="summary-grid">
        <div className="box income-box">
          <small>Masuk</small>
          <h3>{formatRupiah(totalIncome)}</h3>
        </div>
        <div className="box expense-box">
          <small>Keluar</small>
          <h3>{formatRupiah(totalExpense)}</h3>
        </div>
      </div>
      <div className="card" style={{textAlign: 'center', background: '#333', color: 'white'}}>
          <small>Sisa Saldo</small>
          <h2>{formatRupiah(balance)}</h2>
      </div>

      <div className="card">
        <h3>Riwayat</h3>
        {filteredData.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>Kosong.</p> : (
          <ul className="transaction-list">
            {filteredData.map(t => (
              <li key={t.id} className={`transaction-item ${t.type}`}>
                <div>
                  <strong>{t.description}</strong><br/>
                  <small style={{color:'#666'}}>{new Date(t.date).toLocaleDateString('id-ID')}</small>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <span style={{fontWeight:'bold'}}>
                    {t.type === 'expense' ? '-' : '+'} {formatRupiah(t.amount)}
                  </span>
                  <button onClick={() => deleteTransaction(t.id)} className="delete-btn"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
export default App;
