const canvasEl = document.querySelector('canvas#app')!;

type Sides = 'left' | 'right' | 'top' | 'bottom';
type SidesSet = Array<Sides>;
const ALL_SIDES: SidesSet = ['left', 'right', 'top', 'bottom'];

class Cancan {
    private ctx: CanvasRenderingContext2D;
    private _tourStepX = 10;
    private _tourStepY = 10;

    get tourStepX() {
        return this._tourStepX;
    }

    set tourStepX(val) {
        this._tourStepX = val;
    }

    get tourStepY() {
        return this._tourStepY;
    }

    set tourStepY(val) {
        this._tourStepY = val;
    }

    constructor(private elem: HTMLCanvasElement, public WW: number = 800, public HH: number = 800) {
        this.ctx = this.elem.getContext("2d")!;
    }

    public topLeft(): { x: number, y: number } {
        return {x: 0, y: 0};
    }

    public topRight(): { x: number, y: number } {
        return {x: this.WW, y: 0};
    }

    public bottomLeft(): { x: number, y: number } {
        return {x: this.HH, y: 0};
    }

    public bottomRight(): { x: number, y: number } {
        return {x: this.WW, y: this.HH};
    }

    public center(): { x: number, y: number } {
        return {x: this.WW / 2, y: this.HH / 2};
    }

    public background(color: string = "#000000") {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.WW, this.HH);
        return this;
    }

    public border(color: string = "#000000", thickness: number = 1, sides: SidesSet = ALL_SIDES, padding: number = 0) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;

        if (sides.includes('top')) {
            this.ctx.beginPath();
            this.ctx.moveTo(padding, padding + thickness / 2);
            this.ctx.lineTo(this.WW - padding, padding + thickness / 2);
            this.ctx.stroke();
        }

        if (sides.includes('bottom')) {
            this.ctx.beginPath();
            this.ctx.moveTo(padding, this.HH - padding - thickness / 2);
            this.ctx.lineTo(this.WW - padding, this.HH - padding - thickness / 2);
            this.ctx.stroke();
        }

        if (sides.includes('left')) {
            this.ctx.beginPath();
            this.ctx.moveTo(padding + thickness / 2, padding);
            this.ctx.lineTo(padding + thickness / 2, this.HH - padding);
            this.ctx.stroke();
        }

        if (sides.includes('right')) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.WW - padding - thickness / 2, padding);
            this.ctx.lineTo(this.WW - padding - thickness / 2, this.HH - padding);
            this.ctx.stroke();
        }

        return this;
    }

    public tour(x: number, y: number, pattern: string, color: string = "#000000", thickness: number = 1, measure: boolean = false):
        undefined | { minX: number, minY: number, maxX: number, maxY: number } {
        const dx = this._tourStepX;
        const dy = this._tourStepY;
        const originalX = x;
        const originalY = y;
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;

        const setX = (newX: number) => {
            if (newX > maxX) maxX = newX;
            if (newX < minX) minX = newX;
            x = newX;
        };

        const setY = (newY: number) => {
            if (newY > maxY) maxY = newY;
            if (newY < minY) minY = newY;
            y = newY;
        };

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);

        let multi: boolean = false;
        let multiFactor: number = 0;
        const multiply = () => multi ? multiFactor : 1;

        let blank: boolean = false;
        let capture: boolean = false;
        let captureX: number = 0;
        let captureY: number = 0;

        let points: Map<string, { x: number, y: number }> = new Map<string, { x: number, y: number }>();

        for (const ch of pattern) {
            if ([' ', '\t', '\r', '\n'].includes(ch)) {
                continue;
            }
            if (Number.isInteger(+ch)) {
                multi = true;
                multiFactor = multiFactor * 10 + +ch;
                continue;
            }
            if (['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
                'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'].includes(ch)) {
                points.set(ch, {x, y});
                continue;
            }
            if (ch === '(') {
                blank = true;
                continue;
            }
            if (ch === ')') {
                blank = false;
                continue;
            }
            if (ch === '[') {
                capture = true;
                captureX = x;
                captureY = y;
                continue;
            }
            if (ch === ']') {
                capture = false;
                this.ctx.moveTo(captureX, captureY);
                measure ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
                continue;
            }
            if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
                'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].includes(ch)) {
                const point = points.get(ch.toLowerCase());
                if (point) {
                    x = point.x;
                    y = point.y;
                }
            } else {
                switch (ch) {
                    case '.':
                        setX(x + dx * multiply());
                        break;
                    case '-':
                        setX(x - dx * multiply());
                        break;
                    case '|':
                        setY(y + dy * multiply());
                        break;
                    case '/':
                        setY(y - dy * multiply());
                        break;
                    case '@':
                        x = originalX;
                        y = originalY;
                        break;
                    default:
                        throw(new Error(`unknown character in pattern: ${ch}`));
                }
            }
            multi = false;
            multiFactor = 0;
            if (blank || capture || measure) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();

        if (measure) {
            return {
                minX, maxX, minY, maxY
            }
        }

        return undefined;
    }

    public dim(pattern: string) {
        const data: any = this.tour(0, 0, pattern, "#000000", 1, true)!;
        data.dimX = data.maxX - data.minX;
        data.dimY = data.maxY - data.minY;
        return data;
    }

    public static mirrorX(pattern: string) {
        return pattern
            .replace(/\./g, '?')
            .replace(/\-/g, '!')
            .replace(/\?/g, '-')
            .replace(/!/g, '.');
    }

    public static mirrorY(pattern: string) {
        return pattern
            .replace(/\|/g, '?')
            .replace(/\//g, '!')
            .replace(/\?/g, '/')
            .replace(/!/g, '|');
    }

    public static turn(pattern: string) {
        return pattern
            .replace(/\./g, '?')
            .replace(/\|/g, '!')
            .replace(/\//g, '%')
            .replace(/\-/g, '&')
            .replace(/\?/g, '|')
            .replace(/!/g, '-')
            .replace(/%/g, '.')
            .replace(/&/g, '/')
    }

    public static turn2(pattern: string) {
        return this.turn(this.turn(pattern));
    };

    public static turn3(pattern: string) {
        return this.turn(this.turn(this.turn(pattern)));
    };

    public circle(x: number, y: number, r: number, color: string = "#FFFFFF", thickness: number = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}

const cancan = new Cancan(canvasEl as HTMLCanvasElement);

// demo 3
const p1 = `x10.a`;
const p2 = `X10|b`;
const p3 = `X10-c`;
const p4 = `X10/d`;
const p5 = `X[7.7|]e`;
const p6 = `X[7-7|]f`;
const p7 = `X[7-7/]g`;
const p8 = `X[7.7/]h`;
const p9 = `AEBFCGDHX`;
const p = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
console.log(p);
cancan.tour(150, 150, p);
cancan.tour(350, 150, p);
cancan.tour(550, 150, p);
cancan.tour(150, 350, p);
cancan.tour(350, 350, p);
cancan.tour(550, 350, p);
cancan.tour(150, 550, p);
cancan.tour(350, 550, p);
cancan.tour(550, 550, p);

console.log(cancan.dim(`20.30|40/50-`));


// demo 2
// cancan.background();
// const pattern = `78.25|15-10|15.1|16-12/15.23/38-15|1-15/37-23|15.12|16-1/15.10/15-25/`;
// cancan.tour(10, 10, pattern, "#ffffff");
// cancan.tour(10, cancan.HH - 10, Cancan.mirrorY(pattern), "#ffffff");
// cancan.circle(cancan.WW / 2, cancan.HH / 2, 30);

// demo 1
// cancan.background();
// cancan.border("#00ff00", 20, ALL_SIDES, 20);
// cancan.border("#00cc00", 20, ALL_SIDES, 60);
// cancan.border("#00aa00", 20, ALL_SIDES, 100);
// cancan.border("#009900", 20, ALL_SIDES, 140);
// cancan.border("#006600", 20, ALL_SIDES, 180);
// cancan.border("#003300", 20, ALL_SIDES, 220);
// cancan.border("#002200", 20, ALL_SIDES, 260);
// cancan.border("#001100", 20, ALL_SIDES, 300);

