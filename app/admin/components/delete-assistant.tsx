"use client"

import { useState } from 'react'

type Option = { value: string; label: string }

type DeleteAssistantProps = {
	title: string
	description?: string
	impact?: { label: string; count: number }[]
	reassign?: { name: string; label: string; options: Option[] }
	hiddenFields?: Record<string, string>
	confirmLabel?: string
	action: (formData: FormData) => Promise<void>
	triggerClassName?: string
}

export function DeleteAssistant({
	title,
	description,
	impact,
	reassign,
	hiddenFields,
	confirmLabel = 'Eliminar',
	action,
	triggerClassName,
}: DeleteAssistantProps) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className={
					triggerClassName ||
					'h-9 px-3 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10'
				}
			>
				Eliminar
			</button>
			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
					<div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#10141d] p-6 text-sm">
						<h3 className="text-white text-base font-medium">{title}</h3>
						{description && (
							<p className="text-white/70 mt-1">{description}</p>
						)}
						{impact && impact.length > 0 && (
							<div className="mt-4 rounded-lg border border-white/10 bg-[#0b0d12] p-3">
								<ul className="space-y-1 text-white/80">
									{impact.map((i, idx) => (
										<li key={idx} className="flex justify-between">
											<span>{i.label}</span>
											<span className="text-white/60">{i.count}</span>
										</li>
									))}
								</ul>
							</div>
						)}
						<form action={action} className="mt-4 flex items-center justify-between gap-3">
							<div className="flex-1 space-y-2">
								{reassign && (
									<div>
										<label className="block text-xs text-white/70 mb-1">{reassign.label}</label>
										<select name={reassign.name} className="h-10 w-full rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm">
											<option value="">No reasignar</option>
											{reassign.options.map((o) => (
												<option key={o.value} value={o.value}>{o.label}</option>
											))}
										</select>
									</div>
								)}
								{hiddenFields &&
									Object.entries(hiddenFields).map(([k, v]) => (
										<input key={k} type="hidden" name={k} value={v} />
									))}
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setOpen(false)}
									className="h-10 px-4 rounded-lg border border-white/20 text-white/80 hover:bg-white/5"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="h-10 px-4 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
									onClick={() => setOpen(false)}
								>
									{confirmLabel}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	)
}
