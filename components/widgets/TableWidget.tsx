import React from 'react';
import { TableData, TableRow, TableColumn } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TableWidgetProps {
  data: TableData;
  updateData: (data: TableData) => void;
}

const TableWidget: React.FC<TableWidgetProps> = ({ data, updateData }) => {
  const { columns, rows } = data;

  const handleUpdateCell = (rowId: string, columnId: string, value: string) => {
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const newCells = row.cells.map(cell =>
          cell.columnId === columnId ? { ...cell, value } : cell
        );
        return { ...row, cells: newCells };
      }
      return row;
    });
    updateData({ ...data, rows: newRows });
  };

  const handleUpdateHeader = (columnId: string, header: string) => {
    const newColumns = columns.map(col =>
      col.id === columnId ? { ...col, header } : col
    );
    updateData({ ...data, columns: newColumns });
  };
  
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();

  const addColumn = () => {
    const newColumn: TableColumn = { id: uuidv4(), header: 'Новая колонка' };
    const newColumns = [...columns, newColumn];
    const newRows = rows.map(row => ({
      ...row,
      cells: [...row.cells, { columnId: newColumn.id, value: '' }],
    }));
    updateData({ ...data, columns: newColumns, rows: newRows });
  };

  const deleteColumn = (columnId: string) => {
    if (columns.length <= 1) return; // Prevent deleting the last column
    const newColumns = columns.filter(col => col.id !== columnId);
    const newRows = rows.map(row => ({
      ...row,
      cells: row.cells.filter(cell => cell.columnId !== columnId),
    }));
    updateData({ ...data, columns: newColumns, rows: newRows });
  };

  const addRow = () => {
    const newRow: TableRow = {
      id: uuidv4(),
      cells: columns.map(col => ({ columnId: col.id, value: '' })),
    };
    updateData({ ...data, rows: [...rows, newRow] });
  };

  const deleteRow = (rowId: string) => {
    const newRows = rows.filter(row => row.id !== rowId);
    updateData({ ...data, rows: newRows });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-light-glass-border dark:border-glass-border">
              <th className="p-2 w-8"></th>
              {columns.map(col => (
                <th key={col.id} className="p-2 font-semibold text-left group relative">
                  <input
                    type="text"
                    value={col.header}
                    onChange={e => handleUpdateHeader(col.id, e.target.value)}
                    onFocus={handleFocus}
                    className="w-full bg-transparent text-light-text dark:text-dark-text focus:outline-none p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
                  />
                  <button onClick={() => deleteColumn(col.id)} className="absolute top-1/2 -right-1 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </th>
              ))}
              <th className="p-2 w-8">
                <button onClick={addColumn} className="p-1 text-gray-400 hover:text-accent">
                  <Plus size={16} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b border-light-glass-border dark:border-glass-border last:border-b-0 group">
                <td>
                  <button onClick={() => deleteRow(row.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </td>
                {columns.map(col => {
                  const cell = row.cells.find(c => c.columnId === col.id);
                  return (
                    <td key={col.id} className="p-1">
                      <input
                        type="text"
                        value={cell?.value || ''}
                        onChange={e => handleUpdateCell(row.id, col.id, e.target.value)}
                        onFocus={handleFocus}
                        className="w-full bg-transparent text-light-text dark:text-dark-text focus:outline-none p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
                      />
                    </td>
                  );
                })}
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       <div className="flex-shrink-0 pt-2">
        <button onClick={addRow} className="flex items-center gap-2 p-2 text-sm text-gray-400 hover:text-accent">
          <Plus size={16} />
          <span>Добавить строку</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(TableWidget);