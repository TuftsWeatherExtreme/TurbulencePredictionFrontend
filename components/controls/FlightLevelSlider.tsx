"use client";
import { useState } from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

function FlightLevelSlider() {
	const flightLevels: number[] = [
		480, 420, 360, 300, 270, 240, 210, 180, 150, 120, 90, 60, 30, 10,
	];
	const midpoint = 180;

	const [currentFlightLevel, setFlightLevel] = useState<number[]>([-2]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Flight Level</CardTitle>
				<CardDescription>Above Mean Sea Level (MSL)</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2">
					<Slider
						min={-2}
						max={flightLevels.length - 1}
						step={1}
						orientation="vertical"
						value={currentFlightLevel}
						onValueChange={(value) => setFlightLevel(value)}
					/>
					<div className="grid grid-flow-row font-mono text-sm">
						{flightLevels.map((flightLevel, index) => {
							return (
								<span key={index}>
									{flightLevel.toLocaleString().padStart(3, "0")}
								</span>
							);
						})}
						<span>&gt;{midpoint}</span>
						<span>&lt;{midpoint}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default FlightLevelSlider;
