'use strict';

const test = require('ava');

const jsdom = require('jsdom');
const window = global.window = new jsdom.JSDOM().window;
const document = global.document = window.document;

const { SimpleDataTable } = require('../src/index');
const { FIXTURE_3_ROWS } = require('./fixtures/3-rows');

let $target;

test.beforeEach(() => {
    $target = document.createElement('div');
});

test('should be a class', (assert) => {
    assert.regex(String(SimpleDataTable), /^class/);
});

test('clear passed container', (assert) => {
    $target.innerHTML = '<p>aaa</p>';
    assert.is($target.children.length, 1);

    const a = new SimpleDataTable($target);
    a.render();
});

test('lazy load data', (assert) => {
    const a = new SimpleDataTable($target);
    assert.is(a.data.length, 0);

    a.load(FIXTURE_3_ROWS);
    assert.is(a.data.length, 3);
    assert.not(a.data, FIXTURE_3_ROWS);
});

test('render loaded data into DOM', (assert) => {
    const a = new SimpleDataTable($target);
    a.load(FIXTURE_3_ROWS);
    a.render();

    assert.is($target.querySelectorAll('tr').length, FIXTURE_3_ROWS.length);
});

test('add new record after clicking a button', (assert) => {
    const a = new SimpleDataTable($target);
    a.render();

    assert.is($target.querySelectorAll('tr').length, 0);

    const $addButton = $target.querySelector('button.add-row');
    assert.true($addButton instanceof window.HTMLElement);

    a.on(SimpleDataTable.EVENTS.ROW_ADDED, () => {
        assert.is($target.querySelectorAll('tr').length, 1);
    });
    $addButton.dispatchEvent(new window.Event('click'));
});

test('trigger custom event after changed data', (assert) => {
    const a = new SimpleDataTable($target);
    a.load([
        {
            foo: 'bar'
        }
    ]);
    a.render();
    assert.deepEqual(a.data[0].foo, 'bar');

    a.on(SimpleDataTable.EVENTS.UPDATE, (data) => {
        assert.deepEqual(a.data, data);
    });

    $target.querySelector('input').value = 'xxx';
    $target.querySelector('input').dispatchEvent(new window.Event('change'));
    assert.deepEqual(a.data[0].foo, 'xxx');
});

test('support fluent API', (assert) => {
    new SimpleDataTable($target)
        .render()
        .load([])
        .on(SimpleDataTable.EVENTS.UPDATE, () => null)
        .emit(SimpleDataTable.EVENTS.UPDATE)
        .render();

    assert.pass();
});

test('add button text should be configurable', (assert) => {
    const label = 'Załaduj';
    const d = new SimpleDataTable($target, {
        addButtonLabel: label
    });
    d.render();
    const $addButton = $target.querySelector('button.add-row');
    assert.is($addButton.textContent, label);
});

test('removing row should be possible', (assert) => {
    const d = new SimpleDataTable($target);
    d.load([{ foo: 'bar' }]);
    d.render();

    const $removeButton = d.$el.querySelector('button.remove-row');
    assert.true($removeButton instanceof window.HTMLElement);
    assert.not($removeButton.textContent, '');
});

test('API: function to get rows count', (assert) => {
    const d = new SimpleDataTable($target);
    d.load([{ foo: 'bar' }]);
    d.render();

    assert.is(typeof d.getRowsCount, 'function');
    assert.is(d.getRowsCount(), 1);
    d.load([{ foo: 'bar' }, { baz: 'boo' }]);
    assert.is(d.getRowsCount(), 1);
    d.render();
    assert.is(d.getRowsCount(), 2);
});

test('remove row after click button', (assert) => {
    const d = new SimpleDataTable($target);
    d.load([{ foo: 'bar' }]);
    d.render();

    assert.is(d.getRowsCount(), 1);
    assert.is(d.data.length, 1);

    const $removeButton = d.$el.querySelector('button.remove-row');
    $removeButton.dispatchEvent(new window.Event('click'));

    assert.is(d.getRowsCount(), 0);
    assert.is(d.data.length, 0);
});

test('just added row should have remove button', (assert) => {
    const d = new SimpleDataTable($target);
    d.load([{ foo: 'bar' }]);
    d.render();

    const $addButton = $target.querySelector('button.add-row');
    $addButton.dispatchEvent(new window.Event('click'));

    const numberOfRemoveButtons = $target
        .querySelectorAll('button.remove-row').length;

    assert.is(numberOfRemoveButtons, 2);
});

test('remove row action should trigger custom event', (assert) => {
    assert.plan(1);

    const d = new SimpleDataTable($target);
    d.load([{ foo: 'bar' }]);
    d.render();

    const $removeButton = $target.querySelector('button.remove-row');

    d.on(SimpleDataTable.EVENTS.ROW_REMOVED, (data) => {
        assert.deepEqual(d.data, data);
    });

    $removeButton.dispatchEvent(new window.Event('click'));
});

test('default number of columns should be configurable', (assert) => {
    const d = new SimpleDataTable($target, {
        defaultColumnNumber: 5
    });
    d.render();

    const $addButton = $target.querySelector('button.add-row');
    $addButton.dispatchEvent(new window.Event('click'));

    const $firstRow = d.$el.querySelector('tr');
    const $cells = $firstRow.querySelectorAll('td');
    const $cellsWithInput = [...$cells]
        .map($cell => $cell.querySelector('input'))
        .filter($element => $element);

    assert.is($cellsWithInput.length, 5);
});
