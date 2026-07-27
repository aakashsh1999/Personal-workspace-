import { eachDayOfInterval, format, subDays } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { useStore } from '../store';

export function HabitsPanel() {
  const { state, toggleHabitDay, addHabit, deleteHabit } = useStore();
  const [name, setName] = useState('');

  const days = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 13);
    return eachDayOfInterval({ start, end });
  }, []);

  return (
    <div className="habits-panel">
      <p className="habits-intro">
        Track daily routines that support learning and career growth. Click any
        day cell to toggle.
      </p>

      <form
        className="habit-add"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addHabit(name.trim());
          setName('');
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New habit name…"
          aria-label="New habit name"
        />
        <button type="submit" className="btn btn-primary btn-sm">
          <Plus size={15} /> Add habit
        </button>
      </form>

      <div className="habit-grid-wrap">
        <table className="habit-grid">
          <thead>
            <tr>
              <th>Habit</th>
              {days.map((d) => (
                <th key={d.toISOString()}>
                  <span className="habit-day">{format(d, 'EEEEE')}</span>
                  <span className="habit-date">{format(d, 'd')}</span>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {state.habits.map((habit) => (
              <tr key={habit.id}>
                <td>
                  <span
                    className="habit-name-btn"
                    style={{ '--habit': habit.color } as CSSProperties}
                  >
                    <span className="habit-dot" />
                    {habit.name}
                  </span>
                </td>
                {days.map((d) => {
                  const key = format(d, 'yyyy-MM-dd');
                  const done = habit.days.some((x) => x.date === key && x.done);
                  const isToday = key === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <td key={key}>
                      <button
                        type="button"
                        className={`habit-cell ${done ? 'is-done' : ''} ${isToday ? 'is-today' : ''}`}
                        style={{ '--habit': habit.color } as CSSProperties}
                        aria-label={`${habit.name} ${key}${done ? ' done' : ''}`}
                        onClick={() => toggleHabitDay(habit.id, key)}
                      />
                    </td>
                  );
                })}
                <td>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Delete ${habit.name}`}
                    onClick={() => deleteHabit(habit.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
