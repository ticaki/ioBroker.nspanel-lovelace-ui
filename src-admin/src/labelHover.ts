/**
 * Shows the full text of a cut-off field label (MUI InputLabel with ellipsis) while the mouse is over it.
 * The label grows over the neighbouring fields and gets the background of the place it sits on, so it stays
 * readable. Installed once per page for all components and dialogs (dialogs live in portals, so the
 * listener sits on the document).
 */

const EXPANDED_CLASS = 'nlui-label-expanded';
const STYLE_ID = 'nlui-label-hover-style';
const INSTALLED_FLAG = '__nluiLabelHoverInstalled';

const CSS = `
label.MuiInputLabel-root.${EXPANDED_CLASS} {
    max-width: none !important;
    overflow: visible !important;
    text-overflow: clip !important;
    z-index: 10;
    padding-right: 4px;
    border-radius: 2px;
}
`;

/**
 * the first non transparent background above an element - the label takes it over
 *
 * @param el element to start at
 */
function backgroundOf(el: HTMLElement | null): string {
    for (let node = el; node; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)) {
            return bg;
        }
    }
    return '';
}

/**
 * the cut-off label under the mouse, null if there is none
 *
 * @param target event target
 */
function cutLabel(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) {
        return null;
    }
    const label = target.closest('label.MuiInputLabel-root');
    return label instanceof HTMLElement ? label : null;
}

function onOver(e: MouseEvent): void {
    const label = cutLabel(e.target);
    if (!label || label.classList.contains(EXPANDED_CLASS) || label.scrollWidth <= label.clientWidth) {
        return;
    }
    label.style.backgroundColor = backgroundOf(label.parentElement);
    label.classList.add(EXPANDED_CLASS);
}

function onOut(e: MouseEvent): void {
    const label = cutLabel(e.target);
    if (!label || !label.classList.contains(EXPANDED_CLASS)) {
        return;
    }
    if (e.relatedTarget instanceof Node && label.contains(e.relatedTarget)) {
        return;
    }
    label.classList.remove(EXPANDED_CLASS);
    label.style.backgroundColor = '';
}

/** installs style and listeners once per window */
export function installLabelHover(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }
    const flags = window as unknown as Record<string, boolean | undefined>;
    if (flags[INSTALLED_FLAG]) {
        return;
    }
    flags[INSTALLED_FLAG] = true;
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
}
