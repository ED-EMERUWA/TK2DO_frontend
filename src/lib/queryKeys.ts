export const taskKeys = {
  all:        ['tasks']                                                  as const,
  byDate:     (date: string)                  => ['tasks', 'date', date]          as const,
  byMonth:    (year: number, month: number)   => ['tasks', 'month', year, month]  as const,
  detail:     (id: string)                    => ['tasks', 'detail', id]          as const,
} as const;
