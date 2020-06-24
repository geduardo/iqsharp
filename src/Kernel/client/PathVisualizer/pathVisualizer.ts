import { formatInputs } from "./formatters/inputFormatter.js";
import { formatGates } from "./formatters/gateFormatter.js";
import { formatRegisters } from "./formatters/registerFormatter.js";
import { processOperations } from "./process.js";
import { ExecutionPath } from "./executionPath.js";
import { Metadata } from "./metadata.js";
import { GateType } from "./constants.js";

const script = `
<script type="text/JavaScript">
    function toggleClassicalBtn(cls) {
        const textSvg = document.querySelector(\`.\${cls} text\`);
        const group = document.querySelector(\`.\${cls}-group\`);
        const currValue = textSvg.childNodes[0].nodeValue;
        const zeroGates = document.querySelector(\`.\${cls}-zero\`);
        const oneGates = document.querySelector(\`.\${cls}-one\`);
        switch (currValue) {
            case '?':
                textSvg.childNodes[0].nodeValue = '1';
                group.classList.remove('cls-control-unknown');
                group.classList.add('cls-control-one');
                break;
            case '1':
                textSvg.childNodes[0].nodeValue = '0';
                group.classList.remove('cls-control-one');
                group.classList.add('cls-control-zero');
                oneGates.classList.toggle('hidden');
                zeroGates.classList.toggle('hidden');
                break;
            case '0':
                textSvg.childNodes[0].nodeValue = '?';
                group.classList.remove('cls-control-zero');
                group.classList.add('cls-control-unknown');
                zeroGates.classList.toggle('hidden');
                oneGates.classList.toggle('hidden');
                break;
        }
    }
</script>
`;

const style = `
<style>
    .hidden {
        display: none;
    }
    .cls-control-unknown {
        opacity: 0.25;
    }
    <!-- Gate outline -->
    .cls-control-one rect,
    .cls-control-one line,
    .cls-control-one circle {
        stroke: #4059bd;
        stroke-width: 1.3;
    }
    .cls-control-zero rect,
    .cls-control-zero line,
    .cls-control-zero circle {
        stroke: #c40000;
        stroke-width: 1.3;
    }
    <!-- Gate label -->
    .cls-control-one text {
        fill: #4059bd;
    }
    .cls-control-zero text {
        fill: #c40000;
    }
    <!-- Control button -->
    .cls-control-btn {
        cursor: pointer;
    }
    .cls-control-unknown .cls-control-btn {
        fill: #e5e5e5;
    }
    .cls-control-one .cls-control-btn {
        fill: #4059bd;
    }
    .cls-control-zero .cls-control-btn {
        fill: #c40000;
    }
    <!-- Control button text -->
    .cls-control-unknown .cls-control-text {
        fill: black;
        stroke: none;
    }
    .cls-control-one .cls-control-text,
    .cls-control-zero .cls-control-text {
        fill: white;
        stroke: none;
    }
</style>
`;

export class JsonToHtmlEncoder {
    /**
     * Converts JSON representing a circuit from the simulator and returns its SVG representation.
     * 
     * @param json JSON received from simulator.
     * 
     * @returns SVG representation of circuit.
     */
    jsonToSvg = (json: ExecutionPath): string => {
        const { qubits, operations } = json;
        console.log(operations);
        const { qubitWires, registers, svgHeight } = formatInputs(qubits);
        const { metadataList, svgWidth } = processOperations(operations, registers);
        const formattedGates: string = formatGates(metadataList);
        const measureGates: Metadata[] = metadataList.filter(({ type }) => type === GateType.Measure);
        const formattedRegs: string = formatRegisters(registers, measureGates, svgWidth);
        let svg: string = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${svgWidth}" height="${svgHeight}">`;
        svg += script;
        svg += style;
        svg += qubitWires;
        svg += formattedRegs;
        svg += formattedGates;
        svg += '</svg>';
        return svg;
    };

    jsonToHtml = (json: ExecutionPath): string => {
        const svg: string = this.jsonToSvg(json);
        return '<html>\r\n' + svg + '</html>';
    };

    render = (json: ExecutionPath, id: string): void => {
        const html = this.jsonToHtml(json);
        // Wait for container to be ready before populating it with circuit
        const observer = new MutationObserver((mutations, observer) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes == null || mutation.addedNodes.length === 0) continue;
                const container = document.getElementById(id);
                if (container != null) {
                    container.innerHTML = html;
                    observer.disconnect();
                }
                return;
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    };
};
