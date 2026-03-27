'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PRODUCTION_LINES as FALLBACK_PROD, FINISHING_LINES as FALLBACK_FIN } from '@/lib/constants'

export interface LineData {
    id: string
    name: string
    department: 'production' | 'finishing'
    is_active: boolean
}

interface LinesContextType {
    lines: LineData[]
    productionLines: LineData[]
    finishingLines: LineData[]
    loading: boolean
    refreshLines: () => Promise<void>
    getLineName: (lineId: string) => string
}

const LinesContext = createContext<LinesContextType>({
    lines: [],
    productionLines: [],
    finishingLines: [],
    loading: true,
    refreshLines: async () => { },
    getLineName: () => '',
})

export function LinesProvider({ children }: { children: ReactNode }) {
    const [lines, setLines] = useState<LineData[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchLines = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('lines')
            .select('*')
            .eq('is_active', true)
            .order('id', { ascending: true })

        if (error) {
            console.error('Error fetching lines, using fallback hardcoded lines:', error)
            // Fallback in case table doesn't exist yet
            setLines([
                ...FALLBACK_PROD.map(l => ({ ...l, department: 'production' as const, is_active: true })),
                ...FALLBACK_FIN.map(l => ({ ...l, department: 'finishing' as const, is_active: true }))
            ])
        } else if (data) {
            setLines(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchLines()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const productionLines = lines.filter(l => l.department === 'production')
    const finishingLines = lines.filter(l => l.department === 'finishing')

    const getLineName = (lineId: string): string => {
        return lines.find(l => l.id === lineId)?.name || lineId
    }

    return (
        <LinesContext.Provider value={{
            lines,
            productionLines,
            finishingLines,
            loading,
            refreshLines: fetchLines,
            getLineName
        }}>
            {children}
        </LinesContext.Provider>
    )
}

export const useLines = () => useContext(LinesContext)
