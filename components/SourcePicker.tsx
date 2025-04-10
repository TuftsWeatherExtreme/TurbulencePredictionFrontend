"use client";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ChevronDownIcon } from "lucide-react";

function SourcePicker() {
	const [isSATVisible, setSATVisible] = useState<CheckedState>(false);
	const [isRADVisible, setRADVisible] = useState<CheckedState>(true);

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
					checked={isSATVisible}
					onCheckedChange={(value) => setSATVisible(!!value)}
				>
					Satellite
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					key="rad"
					className="capitalize"
					checked={isRADVisible}
					onCheckedChange={(value) => setRADVisible(!!value)}
				>
					Radar
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default SourcePicker;
