// Autocomplete for customFileName input
customInputAutocomplete = {}

const placeholders = [
    '{indicator}',
    '{indicator-short}',
    '{tf}',
    '{exchanges}',
    '{date}',
    '{time}'
];

let autocompleteSelectedIndex = -1;
function createAutocompleteList(input, list, partial) {
    removeAutocompleteList();
    autocompleteSelectedIndex = -1;
    const rect = input.getBoundingClientRect();
    const div = document.createElement('div');
    div.setAttribute('id', 'customFileName-autocomplete-list');
    div.setAttribute('class', 'autocomplete-items w3-card-4');
    div.style.position = 'absolute';
    div.style.left = rect.left + window.scrollX + 'px';
    div.style.top = (rect.bottom + window.scrollY) + 'px';
    div.style.width = rect.width + 'px';
    list.forEach((item, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = item;
        itemDiv.setAttribute('data-index', idx);
        itemDiv.addEventListener('mousedown', function (e) {
            e.preventDefault();
            selectAutocompleteItem(input);
        });
        div.appendChild(itemDiv);
    });
    document.body.appendChild(div);
}

function removeAutocompleteList() {
    const oldList = document.getElementById('customFileName-autocomplete-list');
    if (oldList) oldList.remove();
    autocompleteSelectedIndex = -1;
}
function moveAutocompleteSelection(dir) {
    const list = document.getElementById('customFileName-autocomplete-list');
    if (!list) return;
    const items = Array.from(list.children);
    if (!items.length) return;
    // Remove previous selection
    if (autocompleteSelectedIndex >= 0 && autocompleteSelectedIndex < items.length) {
        items[autocompleteSelectedIndex].classList.remove('autocomplete-selected');
    }
    autocompleteSelectedIndex += dir;
    if (autocompleteSelectedIndex < 0) autocompleteSelectedIndex = items.length - 1;
    if (autocompleteSelectedIndex >= items.length) autocompleteSelectedIndex = 0;
    items[autocompleteSelectedIndex].classList.add('autocomplete-selected');
    items[autocompleteSelectedIndex].scrollIntoView({ block: 'nearest' });
}

function selectAutocompleteItem(input) {
    const list = document.getElementById('customFileName-autocomplete-list');
    if (!list) return false;

    const partial = getPartialPlaceholder(input);
    if (!partial) return false;

    const selectedItem = list.querySelector('.autocomplete-selected')?.innerText;
    if (!selectedItem) return false;

    insertPlaceholderAtCursor(input, selectedItem, partial);
    removeAutocompleteList();
    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}

function insertPlaceholderAtCursor(input, text, partial) {
    const start = input.selectionStart - (partial ? partial.length : 0);
    const end = input.selectionEnd;
    const value = input.value;
    input.value = value.substring(0, start) + text + value.substring(end);
    input.selectionStart = input.selectionEnd = start + text.length;
}

function getPartialPlaceholder(input) {
    const cursor = input.selectionStart;
    const value = input.value;
    const match = /\{[a-zA-Z\-]*$/.exec(value.substring(0, cursor));
    return match ? match[0] : null;
}

function verifyInput(e, input) {
    // Only handle user input, not programmatic changes
    if (e.isTrusted === false) return;
    const partial = getPartialPlaceholder(input);
    if (partial) {
        // Remove placeholders already used in the input (except the one being typed)
        const used = new Set();
        const value = input.value;
        placeholders.forEach(ph => {
            // Only count as used if it's not the current partial being typed
            if (ph !== partial && value.includes(ph)) used.add(ph);
        });
        const filtered = placeholders.filter(p => p.startsWith(partial) && !used.has(p));
        if (filtered.length > 0) {
            createAutocompleteList(input, filtered, partial);
        } else {
            removeAutocompleteList();
        }
    } else {
        removeAutocompleteList();
    }
}
