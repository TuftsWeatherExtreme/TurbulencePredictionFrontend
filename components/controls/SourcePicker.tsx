"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ChevronDownIcon } from "lucide-react";

function SourcePicker({
	sources,
	setSources,
}: {
	sources: boolean[];
	setSources: (value: boolean[]) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm">
					<span>Sources</span>
					<ChevronDownIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-full">
				<DropdownMenuCheckboxItem
					key="sat"
					className="capitalize"
					checked={sources[0]}
					onCheckedChange={(value) => setSources([!!value, sources[1]])}
				>
					Satellite
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					key="rad"
					className="capitalize"
					checked={sources[1]}
					onCheckedChange={(value) => setSources([sources[0], !!value])}
				>
					Radar
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default SourcePicker;
