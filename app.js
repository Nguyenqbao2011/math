/**
 * Math & Thống Kê Pro - Application Controller
 * Handles dual-mode number synchronization, live computation,
 * local storage history, basic math calculator, and PWA install prompt.
 */

(function () {
  'use strict';

  // --- STATE ---
  let numbersList = [];
  let isUpdatingFromBulk = false;
  let deferredInstallPrompt = null;
  const HISTORY_STORAGE_KEY = 'statsmath_history_v1';

  // --- DOM ELEMENTS ---
  const tabStats = document.getElementById('tabStats');
  const tabCalc = document.getElementById('tabCalc');
  const statsView = document.getElementById('statsView');
  const calcView = document.getElementById('calcView');

  // Stats Input Elements
  const singleNumberInput = document.getElementById('singleNumberInput');
  const btnAddNumber = document.getElementById('btnAddNumber');
  const chipsContainer = document.getElementById('chipsContainer');
  const chipCountEl = document.getElementById('chipCount');
  const btnClearAll = document.getElementById('btnClearAll');
  const bulkNumbersTextarea = document.getElementById('bulkNumbersTextarea');
  const btnSampleData = document.getElementById('btnSampleData');
  const btnSaveHistory = document.getElementById('btnSaveHistory');
  const btnCopyStats = document.getElementById('btnCopyStats');

  // Stats Output Elements
  const valMean = document.getElementById('valMean');
  const valMedian = document.getElementById('valMedian');
  const valMode = document.getElementById('valMode');
  const valCount = document.getElementById('valCount');
  const valSum = document.getElementById('valSum');
  const valRange = document.getElementById('valRange');
  const valMin = document.getElementById('valMin');
  const valMax = document.getElementById('valMax');
  const valQ1 = document.getElementById('valQ1');
  const valQ3 = document.getElementById('valQ3');
  const valIQR = document.getElementById('valIQR');
  const valPopStdDev = document.getElementById('valPopStdDev');
  const valPopVariance = document.getElementById('valPopVariance');

  // Calculator Elements
  const calcFormula = document.getElementById('calcFormula');
  const calcInput = document.getElementById('calcInput');
  let currentCalcExpr = '';

  // History Drawer Elements
  const btnHistoryToggle = document.getElementById('btnHistoryToggle');
  const historyOverlay = document.getElementById('historyOverlay');
  const historyDrawer = document.getElementById('historyDrawer');
  const btnCloseHistory = document.getElementById('btnCloseHistory');
  const historyListContainer = document.getElementById('historyListContainer');
  const historyCountBadge = document.getElementById('historyCountBadge');
  const historyTotalCount = document.getElementById('historyTotalCount');
  const btnClearHistory = document.getElementById('btnClearHistory');

  // PWA & Toast Elements
  const btnInstallApp = document.getElementById('btnInstallApp');
  const toastEl = document.getElementById('toast');

  // --- UTILITIES ---
  function showToast(message, duration = 2500) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, duration);
  }

  function formatNumber(num, maxDecimals = 4) {
    if (typeof num !== 'number' || isNaN(num)) return '-';
    if (Number.isInteger(num)) return num.toString();
    // Round to avoid floating point precision noise
    const factor = Math.pow(10, maxDecimals);
    const rounded = Math.round((num + Number.EPSILON) * factor) / factor;
    return rounded.toString();
  }


  // --- COUNT-UP ANIMATION ---
  // Numbers climb through whole units; duration scales with how far they have to travel.
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MS_PER_UNIT = 20;     // ~50 units / second: a little slower, easy to follow
  const MIN_DURATION = 500;   // small changes take a bit longer
  const MAX_DURATION = 2200;  // big changes still capped

  function finalText(el) {
    return el.dataset.final !== undefined ? el.dataset.final : el.textContent;
  }

  // Set plain text (no animation) and cancel any running animation
  function setStatText(el, text) {
    if (el._raf) cancelAnimationFrame(el._raf);
    el._raf = null;
    el._current = null;
    el.dataset.final = text;
    el.textContent = text;
  }

  // Animate el from its current number to `target`, finishing on the exact formatted text
  function animateStat(el, target, finalStr) {
    if (el._raf) cancelAnimationFrame(el._raf);
    el._raf = null;
    el.dataset.final = finalStr;

    const from = typeof el._current === 'number' ? el._current : 0;
    const delta = target - from;

    if (reduceMotion || delta === 0 || !isFinite(delta)) {
      el._current = target;
      el.textContent = finalStr;
      return;
    }

    const duration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.abs(delta) * MS_PER_UNIT));
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2); // gentle ease-out
      const value = from + delta * eased;
      el._current = value;

      if (t < 1) {
        el.textContent = Math.round(value).toString(); // whole-unit steps
        el._raf = requestAnimationFrame(frame);
      } else {
        el._current = target;
        el._raf = null;
        el.textContent = finalStr; // land on the exact value (with decimals)
      }
    }
    el._raf = requestAnimationFrame(frame);
  }

  function setStatNumber(el, num) {
    animateStat(el, num, formatNumber(num));
  }

  // --- TAB NAVIGATION ---
  function switchTab(targetTab) {
    if (targetTab === 'stats') {
      tabStats.classList.add('active');
      tabStats.setAttribute('aria-selected', 'true');
      tabCalc.classList.remove('active');
      tabCalc.setAttribute('aria-selected', 'false');

      statsView.classList.add('active');
      statsView.hidden = false;
      calcView.classList.remove('active');
      calcView.hidden = true;
    } else {
      tabCalc.classList.add('active');
      tabCalc.setAttribute('aria-selected', 'true');
      tabStats.classList.remove('active');
      tabStats.setAttribute('aria-selected', 'false');

      calcView.classList.add('active');
      calcView.hidden = false;
      statsView.classList.remove('active');
      statsView.hidden = true;
    }
  }

  tabStats.addEventListener('click', () => switchTab('stats'));
  tabCalc.addEventListener('click', () => switchTab('calc'));

  // --- STATS COMPUTATION & RENDERING ---
  function updateStats() {
    chipCountEl.textContent = numbersList.length;

    if (numbersList.length === 0) {
      setStatText(valMean, '-');
      setStatText(valMedian, '-');
      setStatText(valMode, '-');
      setStatText(valCount, '0');
      setStatText(valSum, '-');
      setStatText(valRange, '-');
      setStatText(valMin, '-');
      setStatText(valMax, '-');
      setStatText(valQ1, '-');
      setStatText(valQ3, '-');
      setStatText(valIQR, '-');
      setStatText(valPopStdDev, '-');
      setStatText(valPopVariance, '-');
      return;
    }

    const stats = StatsEngine.calculateStats(numbersList);

    // Auto-sort numbersList ascending so chips display in order
    numbersList = stats.sorted.slice();

    setStatNumber(valMean, stats.mean);
    setStatNumber(valMedian, stats.median);
    animateStat(valCount, stats.count, String(stats.count));
    setStatNumber(valSum, stats.sum);
    setStatNumber(valMin, stats.min);
    setStatNumber(valMax, stats.max);
    setStatNumber(valRange, stats.range);

    // Mode
    if (stats.mode.length === 0) {
      setStatText(valMode, 'Không có mốt (tất cả xuất hiện 1 lần)');
    } else {
      setStatText(valMode, stats.mode.map(m => formatNumber(m)).join(', '));
    }

    // Quartiles
    setStatNumber(valQ1, stats.q1);
    setStatNumber(valQ3, stats.q3);
    setStatNumber(valIQR, stats.iqr);

    setStatNumber(valPopVariance, stats.popVariance);
    setStatNumber(valPopStdDev, stats.popStdDev);
  }

  // --- CHIP RENDERING & DUAL SYNC ---
  function renderChips() {
    chipsContainer.innerHTML = '';

    if (numbersList.length === 0) {
      chipsContainer.innerHTML = '<span class="chips-empty-msg">Chưa có số nào. Nhập số bên trên hoặc dán danh sách bên dưới.</span>';
      return;
    }

    const fragment = document.createDocumentFragment();
    numbersList.forEach((num, index) => {
      const chip = document.createElement('div');
      chip.className = 'num-chip';
      chip.innerHTML = `
        <span>${formatNumber(num)}</span>
        <button type="button" class="chip-remove-btn" data-index="${index}" title="Xóa số này" aria-label="Xóa ${num}">×</button>
      `;
      fragment.appendChild(chip);
    });

    chipsContainer.appendChild(fragment);
  }

  function syncToBulkTextarea() {
    if (isUpdatingFromBulk) return;
    bulkNumbersTextarea.value = numbersList.join(', ');
  }

  function addSingleNumber(num) {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return;
    numbersList.push(num);
    updateStats();       // sorts numbersList internally
    renderChips();       // re-render chips in sorted order
    syncToBulkTextarea();
  }

  function removeNumberAtIndex(index) {
    if (index >= 0 && index < numbersList.length) {
      numbersList.splice(index, 1);
      updateStats();       // sorts numbersList internally
      renderChips();       // re-render chips in sorted order
      syncToBulkTextarea();
    }
  }

  function clearAllNumbers() {
    if (numbersList.length === 0) return;
    numbersList = [];
    renderChips();
    bulkNumbersTextarea.value = '';
    updateStats();
    showToast('Đã xóa toàn bộ danh sách');
  }

  // Single Input Form Submit
  function handleSingleAdd() {
    const val = singleNumberInput.value.trim();
    if (val === '') return;
    const num = Number(val);
    if (!isNaN(num) && isFinite(num)) {
      addSingleNumber(num);
      singleNumberInput.value = '';
      singleNumberInput.focus();
    } else {
      showToast('Vui lòng nhập một số hợp lệ');
    }
  }

  btnAddNumber.addEventListener('click', handleSingleAdd);
  singleNumberInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSingleAdd();
    }
  });

  // Chip remove delegate
  chipsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.chip-remove-btn');
    if (removeBtn) {
      const idx = parseInt(removeBtn.getAttribute('data-index'), 10);
      removeNumberAtIndex(idx);
    }
  });

  btnClearAll.addEventListener('click', clearAllNumbers);

  // Bulk Textarea Input Listener
  let debounceTimer = null;
  bulkNumbersTextarea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      isUpdatingFromBulk = true;
      const text = bulkNumbersTextarea.value;
      numbersList = StatsEngine.parseNumberList(text);
      updateStats();       // sorts numbersList internally
      renderChips();       // re-render chips in sorted order
      isUpdatingFromBulk = false;
    }, 150);
  });

  // Sample Data Button
  btnSampleData.addEventListener('click', () => {
    const sample = [12, 25.5, 18, 42, 25.5, 30, 8, 55, 19, 33];
    numbersList = [...sample];
    updateStats();       // sorts numbersList internally
    renderChips();       // re-render chips in sorted order
    syncToBulkTextarea();
    showToast('Đã nạp 10 số liệu mẫu thử nghiệm');
  });

  // Copy Single Hero Stats
  document.querySelectorAll('.copy-small-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-copy');
      const val = finalText(type === 'mean' ? valMean : valMedian);
      if (val === '-') return;
      navigator.clipboard.writeText(val).then(() => {
        showToast(`Đã sao chép ${type === 'mean' ? 'Trung bình' : 'Trung vị'}: ${val}`);
      });
    });
  });

  // Copy Full Stats Report
  btnCopyStats.addEventListener('click', () => {
    if (numbersList.length === 0) {
      showToast('Chưa có dữ liệu để sao chép');
      return;
    }
    const report = [
      `=== BÁO CÁO THỐNG KÊ (StatsMath PRO) ===`,
      `Số lượng (N): ${finalText(valCount)}`,
      `Trung bình (Mean): ${finalText(valMean)}`,
      `Trung vị (Median): ${finalText(valMedian)}`,
      `Mốt (Mode): ${finalText(valMode)}`,
      `Nhỏ nhất (Min): ${finalText(valMin)}`,
      `Tứ phân vị Q₁: ${finalText(valQ1)}`,
      `Tứ phân vị Q₃: ${finalText(valQ3)}`,
      `Khoảng tứ phân vị (IQR): ${finalText(valIQR)}`,
      `Lớn nhất (Max): ${finalText(valMax)}`,
      `Khoảng biến thiên (Range): ${finalText(valRange)}`,
      `Độ lệch chuẩn (Std Dev): ${finalText(valPopStdDev)}`,
      `Phương sai (Variance): ${finalText(valPopVariance)}`
        ].join('\n');

    navigator.clipboard.writeText(report).then(() => {
      showToast('Đã sao chép toàn bộ báo cáo thống kê');
    });
  });

  // --- LOCAL STORAGE HISTORY ---
  function getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistoryItem() {
    if (numbersList.length === 0) {
      showToast('Cần có ít nhất một số để lưu lịch sử');
      return;
    }

    const history = getHistory();
    const stats = StatsEngine.calculateStats(numbersList);
    const now = new Date();
    const timeStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const item = {
      id: Date.now(),
      timestamp: timeStr,
      count: stats.count,
      mean: formatNumber(stats.mean),
      median: formatNumber(stats.median),
      numbers: [...numbersList]
    };

    // Prepend to history, keep top 50
    history.unshift(item);
    if (history.length > 50) history.pop();

    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      renderHistory();
      showToast('Đã lưu phiên tính vào lịch sử!');
    } catch (e) {
      showToast('Không thể lưu do bộ nhớ trình duyệt đầy');
    }
  }

  function deleteHistoryItem(id) {
    let history = getHistory();
    history = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    renderHistory();
    showToast('Đã xóa bản ghi');
  }

  function clearAllHistory() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử không?')) return;
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    renderHistory();
    showToast('Đã xóa sạch lịch sử');
  }

  function loadHistoryItem(id) {
    const history = getHistory();
    const found = history.find(item => item.id === id);
    if (found && Array.isArray(found.numbers)) {
      numbersList = [...found.numbers];
      updateStats();       // sorts numbersList internally
      renderChips();       // re-render chips in sorted order
      syncToBulkTextarea();
      closeHistoryDrawer();
      showToast(`Đã khôi phục ${found.numbers.length} số từ lịch sử`);
    }
  }

  function renderHistory() {
    const history = getHistory();
    historyCountBadge.textContent = history.length;
    historyTotalCount.textContent = `${history.length} bản ghi`;

    if (history.length === 0) {
      historyListContainer.innerHTML = '<div class="history-empty">Chưa có bản ghi nào được lưu. Bấm "Lưu vào Lịch sử" ở bảng thống kê để lưu lại kết quả.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();
    history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-item-top">
          <span class="history-timestamp">${item.timestamp}</span>
          <div class="history-actions">
            <button class="history-load-btn" data-id="${item.id}" title="Nạp lại dãy số này">Nạp lại</button>
            <button class="history-del-btn" data-id="${item.id}" title="Xóa bản ghi">🗑</button>
          </div>
        </div>
        <div class="history-metrics">
          <span class="history-metric-badge">N: <strong>${item.count}</strong></span>
          <span class="history-metric-badge">x̄: <strong>${item.mean}</strong></span>
          <span class="history-metric-badge">Me: <strong>${item.median}</strong></span>
        </div>
        <div class="history-preview-numbers" title="${item.numbers.join(', ')}">
          ${item.numbers.join(', ')}
        </div>
      `;
      fragment.appendChild(div);
    });

    historyListContainer.innerHTML = '';
    historyListContainer.appendChild(fragment);
  }

  // History Drawer Open / Close
  function openHistoryDrawer() {
    renderHistory();
    historyOverlay.classList.add('open');
    historyDrawer.classList.add('open');
    historyDrawer.setAttribute('aria-hidden', 'false');
  }

  function closeHistoryDrawer() {
    historyOverlay.classList.remove('open');
    historyDrawer.classList.remove('open');
    historyDrawer.setAttribute('aria-hidden', 'true');
  }

  btnHistoryToggle.addEventListener('click', openHistoryDrawer);
  btnCloseHistory.addEventListener('click', closeHistoryDrawer);
  historyOverlay.addEventListener('click', closeHistoryDrawer);
  btnSaveHistory.addEventListener('click', saveHistoryItem);
  btnClearHistory.addEventListener('click', clearAllHistory);

  // History action delegate
  historyListContainer.addEventListener('click', (e) => {
    const loadBtn = e.target.closest('.history-load-btn');
    if (loadBtn) {
      const id = parseInt(loadBtn.getAttribute('data-id'), 10);
      loadHistoryItem(id);
      return;
    }
    const delBtn = e.target.closest('.history-del-btn');
    if (delBtn) {
      const id = parseInt(delBtn.getAttribute('data-id'), 10);
      deleteHistoryItem(id);
    }
  });

  // --- BASIC MATH CALCULATOR LOGIC ---
  function updateCalcDisplay() {
    calcInput.value = currentCalcExpr || '0';
  }

  function handleCalcKey(key) {
    if (key === '.') {
      currentCalcExpr += '.';
    } else {
      currentCalcExpr += key;
    }
    updateCalcDisplay();
  }

  function handleCalcAction(action) {
    if (action === 'clear') {
      currentCalcExpr = '';
      calcFormula.textContent = '';
      updateCalcDisplay();
    } else if (action === 'backspace') {
      currentCalcExpr = currentCalcExpr.slice(0, -1);
      updateCalcDisplay();
    } else if (action === 'sqrt') {
      if (currentCalcExpr) {
        currentCalcExpr = `sqrt(${currentCalcExpr})`;
      } else {
        currentCalcExpr = 'sqrt(';
      }
      updateCalcDisplay();
    } else if (action === 'calculate') {
      if (!currentCalcExpr) return;
      try {
        const result = StatsEngine.evaluateBasic(currentCalcExpr);
        calcFormula.textContent = `${currentCalcExpr} =`;
        currentCalcExpr = formatNumber(result, 6);
        updateCalcDisplay();
      } catch (err) {
        showToast(err.message || 'Lỗi biểu thức');
      }
    } else if (action === 'sendToStats') {
      if (!currentCalcExpr) return;
      try {
        const result = StatsEngine.evaluateBasic(currentCalcExpr);
        addSingleNumber(result);
        switchTab('stats');
        showToast(`Đã nạp kết quả ${formatNumber(result)} vào Thống kê!`);
      } catch (err) {
        showToast('Chưa có kết quả số hợp lệ để nạp');
      }
    }
  }

  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      const action = btn.getAttribute('data-action');
      if (key) {
        handleCalcKey(key);
      } else if (action) {
        handleCalcAction(action);
      }
    });
  });

  // Keyboard support for calculator
  window.addEventListener('keydown', (e) => {
    if (calcView.classList.contains('active')) {
      if (/[0-9+\-*/().%]/.test(e.key)) {
        handleCalcKey(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCalcAction('calculate');
      } else if (e.key === 'Backspace') {
        handleCalcAction('backspace');
      } else if (e.key === 'Escape') {
        handleCalcAction('clear');
      }
    }
  });

  // --- PWA SERVICE WORKER & INSTALL PROMPT ---
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('Service Worker Registered successfully:', reg.scope);
        })
        .catch(err => {
          console.warn('Service Worker registration skipped/failed:', err);
        });
    });
  }

  // Capture PWA beforeinstallprompt event for desktop and android
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    deferredInstallPrompt = e;
    // Reveal the Install button
    btnInstallApp.classList.remove('hidden');
  });

  btnInstallApp.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      showToast('Để cài đặt: Trên Chrome chọn menu (⋮) -> Cài đặt ứng dụng');
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Đang cài đặt ứng dụng vào thiết bị...');
    }
    deferredInstallPrompt = null;
    btnInstallApp.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    showToast('🎉 Đã cài đặt StatsMath PRO thành công!');
    btnInstallApp.classList.add('hidden');
    deferredInstallPrompt = null;
  });

  // --- INITIALIZATION ---
  renderChips();
  updateStats();
  renderHistory();
})();
