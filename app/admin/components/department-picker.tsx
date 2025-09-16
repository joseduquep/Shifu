"use client"

import { useEffect, useMemo, useState } from 'react'

interface DepartmentOption {
	id: string
	nombre: string
}

interface DepartmentPickerProps {
	name: string
	options: DepartmentOption[]
	defaultValue?: string
	placeholder?: string
	className?: string
}

export function DepartmentPicker({
	name,
	options,
	defaultValue,
	placeholder = 'Buscar departamento…',
	className,
}: DepartmentPickerProps) {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [selectedId, setSelectedId] = useState<string>('')

	useEffect(() => {
		if (!defaultValue) return
		const found = options.find((o) => o.id === defaultValue)
		if (found) {
			setSelectedId(found.id)
			setQuery(found.nombre)
		}
	}, [defaultValue, options])

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return options.slice(0, 10)
		return options
			.filter((o) => o.nombre.toLowerCase().includes(q))
			.slice(0, 10)
	}, [options, query])

	return (
		<div className={"relative " + (className || '')}>
			<input type="hidden" name={name} value={selectedId} />
			<input
				type="text"
				value={query}
				onChange={(e) => {
					setQuery(e.target.value)
					setOpen(true)
				}}
				onFocus={() => setOpen(true)}
				placeholder={placeholder}
				className="h-10 w-full rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm"
				aria-autocomplete="list"
				aria-expanded={open}
				role="combobox"
				aria-controls="dept-listbox"
				autoComplete="off"
			/>
			{open && (
				<div className="absolute z-20 mt-1 w-full rounded-lg border border-white/15 bg-[#10141d] shadow-lg">
					<ul id="dept-listbox" role="listbox" className="max-h-60 overflow-auto py-1">
						{filtered.length === 0 && (
							<li className="px-3 py-2 text-sm text-white/60">Sin resultados</li>
						)}
						{filtered.map((o) => (
							<li key={o.id} role="option" aria-selected={o.id === selectedId}>
								<button
									type="button"
									onClick={() => {
										setSelectedId(o.id)
										setQuery(o.nombre)
										setOpen(false)
									}}
									className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
								>
									{o.nombre}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}