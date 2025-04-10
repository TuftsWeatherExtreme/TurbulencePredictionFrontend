"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

function AircraftPicker({
	sizeClass,
	setSizeClass,
}: {
	sizeClass: string;
	setSizeClass: (value: string) => void;
}) {
	return (
		<Select value={sizeClass} onValueChange={(value) => setSizeClass(value)}>
			<SelectTrigger size="sm" className="bg-background">
				<SelectValue placeholder="Aircraft Size" />
			</SelectTrigger>
			<SelectContent align="end">
				<SelectItem value="l">Light</SelectItem>
				<SelectItem value="m">Medium</SelectItem>
				<SelectItem value="h">Heavy</SelectItem>
			</SelectContent>
		</Select>
	);
}

export default AircraftPicker;
