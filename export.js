/**
 * BVTMaths - Export Module (Excel & Word)
 * Exports entered numbers and calculated statistical metrics cleanly.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.exportToExcel = exports.exportToExcel;
    root.exportToWord = exports.exportToWord;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getStatsData(numbersList, formatNumber) {
    const stats = StatsEngine.calculateStats(numbersList);
    const fn = typeof formatNumber === 'function' ? formatNumber : (n => String(n));

    const outlierStr = stats.outliers && stats.outliers.length > 0
      ? [...new Set(stats.outliers)].map(x => fn(x)).join(', ')
      : 'Không có';

    const modeStr = stats.mode && stats.mode.length > 0
      ? stats.mode.map(m => fn(m)).join(', ')
      : 'Không có mốt';

    return {
      sortedString: stats.sorted.join(', '),
      items: [
        { label: 'Số lượng phần tử (N)', value: fn(stats.count) },
        { label: 'Trung bình (x̄)', value: fn(stats.mean) },
        { label: 'Trung vị (Me)', value: fn(stats.median) },
        { label: 'Mốt (Mo)', value: modeStr },
        { label: 'Giá trị nhỏ nhất (x_min)', value: fn(stats.min) },
        { label: 'Tứ phân vị 1 (Q₁)', value: fn(stats.q1) },
        { label: 'Tứ phân vị 3 (Q₃)', value: fn(stats.q3) },
        { label: 'Khoảng tứ phân vị (IQR)', value: fn(stats.iqr) },
        { label: 'Giá trị bất thường', value: outlierStr },
        { label: 'Khoảng chuẩn', value: `[${fn(stats.lowerOutlierThreshold)} ; ${fn(stats.upperOutlierThreshold)}]` },
        { label: 'Giá trị lớn nhất (x_max)', value: fn(stats.max) },
        { label: 'Khoảng biến thiên (R)', value: fn(stats.range) },
        { label: 'Tổng cộng (Σ)', value: fn(stats.sum) },
        { label: 'Độ lệch chuẩn (σ)', value: fn(stats.popStdDev) },
        { label: 'Phương sai (σ²)', value: fn(stats.popVariance) }
      ]
    };
  }

  function exportToExcel(numbersList, formatNumber) {
    if (!numbersList || numbersList.length === 0) {
      throw new Error('Chưa có dữ liệu để xuất file Excel');
    }

    if (typeof XLSX === 'undefined') {
      throw new Error('Thư viện Excel (SheetJS) chưa tải xong hoặc không có kết nối mạng');
    }

    const data = getStatsData(numbersList, formatNumber);

    const sheetData = [
      ['BVTMaths - BÁO CÁO THỐNG KÊ'],
      [],
      ['Dãy số đã nhập:', data.sortedString],
      [],
      ['Chỉ số thống kê', 'Giá trị']
    ];

    data.items.forEach(item => {
      sheetData.push([item.label, item.value]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 },
      { wch: 40 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thống kê BVTMaths');

    XLSX.writeFile(wb, 'BVTMaths_KetQua.xlsx');
  }

  async function exportToWord(numbersList, formatNumber) {
    if (!numbersList || numbersList.length === 0) {
      throw new Error('Chưa có dữ liệu để xuất file Word');
    }

    if (typeof docx === 'undefined') {
      throw new Error('Thư viện Word (docx.js) chưa tải xong hoặc không có kết nối mạng');
    }

    const data = getStatsData(numbersList, formatNumber);
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, AlignmentType } = docx;

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({
              children: [new TextRun({ text: 'Chỉ số thống kê', bold: true, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: '0284C7' }
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({
              children: [new TextRun({ text: 'Giá trị', bold: true, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: '0284C7' }
          })
        ]
      })
    ];

    data.items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [new Paragraph({
                children: [new TextRun({ text: item.label, bold: true })]
              })],
              shading: { fill: bgColor }
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [new Paragraph({
                children: [new TextRun({ text: String(item.value) })]
              })],
              shading: { fill: bgColor }
            })
          ]
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: 'BVTMaths - Báo Cáo Kết Quả Thống Kê', bold: true, color: '0284C7' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Dãy số đã nhập: ', bold: true }),
              new TextRun({ text: data.sortedString })
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Bảng kết quả chi tiết:', bold: true })],
            spacing: { after: 120 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    if (typeof saveAs !== 'undefined') {
      saveAs(blob, 'BVTMaths_KetQua.docx');
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BVTMaths_KetQua.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  return {
    exportToExcel,
    exportToWord
  };
}));

