import { eachDayOfInterval, format, subDays } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { useStore } from '../store'

const HABIT_COLORS = [
  '#0d9488',
  '#0284c7',
  '#16a34a',
  '#d97706',
  '#ea580c',
  '#e11d48',
  '#7c3aed',
  '#2563eb',
  '#0891b2',
  '#ca8a04',
] as const

export function HabitsPanel() {
  const { state, toggleHabitDay, addHabit, updateHabit, deleteHabit } = useStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(HABIT_COLORS[0])

  const days = useMemo(() => {
    const end = new Date()
    const start = subDays(end, 13)
    return eachDayOfInterval({ start, end })
  }, [])

  return (
    <div className="habits-panel">
      <p className="habits-intro">
        Track daily routines that support learning and career growth. Pick a
        color per habit, then click any day cell to toggle.
      </p>

      <form
        className="habit-add"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          addHabit(name.trim(), color)
          setName('')
          const used = new Set([
            ...state.habits.map((h) => h.color.toLowerCase()),
            color.toLowerCase(),
          ])
          const next =
            HABIT_COLORS.find((c) => !used.has(c.toLowerCase())) ??
            HABIT_COLORS[(state.habits.length + 1) % HABIT_COLORS.length]
          setColor(next)
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New habit name…"
          aria-label="New habit name"
        />
        <div className="habit-color-picker" role="group" aria-label="Habit color">
          {HABIT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`habit-swatch${color === c ? ' is-active' : ''}`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
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
                  <div
                    className="habit-name-row"
                    style={{ '--habit': habit.color } as CSSProperties}
                  >
                    <span className="habit-dot" aria-hidden />
                    <span className="habit-name-label">{habit.name}</span>
                    <div
                      className="habit-color-picker habit-color-picker--inline"
                      role="group"
                      aria-label={`Color for ${habit.name}`}
                    >
                      {HABIT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`habit-swatch habit-swatch--sm${
                            habit.color.toLowerCase() === c.toLowerCase()
                              ? ' is-active'
                              : ''
                          }`}
                          style={{ background: c }}
                          aria-label={`Set ${habit.name} to ${c}`}
                          aria-pressed={
                            habit.color.toLowerCase() === c.toLowerCase()
                          }
                          onClick={() => updateHabit(habit.id, { color: c })}
                        />
                      ))}
                    </div>
                  </div>
                </td>
                {days.map((d) => {
                  const key = format(d, 'yyyy-MM-dd')
                  const done = habit.days.some((x) => x.date === key && x.done)
                  const isToday = key === format(new Date(), 'yyyy-MM-dd')
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
                  )
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
  )
}
