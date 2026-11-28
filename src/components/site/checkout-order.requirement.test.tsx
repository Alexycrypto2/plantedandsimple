// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { CheckoutOrder } from './CheckoutOrder';
import type { PackageId } from '@/lib/bundle-offers';
afterEach(cleanup);
function Page({ recovery = false }: { recovery?: boolean }) {
  const [selected, setSelected] = useState<PackageId[]>(['cookbook']);
  return <CheckoutOrder selected={selected} prices={{ cookbook: 999, prep: 2700, kit: 399 }} onChange={setSelected} recovery={recovery} />;
}
describe('One product has no extra discount, two have a discount and all packages cost $30.99', () => {
  it('A cookbook buyer pays the current individual price without an extra discount', () => {
    render(<Page />);
    expect(screen.getByLabelText('Order total').textContent).toBe('$9.99');
  });
  it('A buyer adds the prep system and pays the discounted pair price of $27.99', () => {
    render(<Page />); fireEvent.click(screen.getByRole('checkbox', { name: 'Meal Prep & Kitchen System' }));
    expect(screen.getByLabelText('Order total').textContent).toBe('$27.99');
  });
  it('A buyer adds the weekly kit and pays the discounted pair price of $11.99', () => {
    render(<Page />); fireEvent.click(screen.getByRole('checkbox', { name: 'Weekly Meal Planning Kit' }));
    expect(screen.getByLabelText('Order total').textContent).toBe('$11.99');
  });
  it('A buyer chooses only the prep system and kit and pays $26.99', () => {
    render(<Page />); fireEvent.click(screen.getByRole('button', { name: 'Get all three — $30.99' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Premium High-Protein Cookbook' }));
    expect(screen.getByLabelText('Order total').textContent).toBe('$26.99');
  });
  it('A buyer upgrades to all three packages and pays exactly $30.99', () => {
    render(<Page />); fireEvent.click(screen.getByRole('button', { name: 'Get all three — $30.99' }));
    expect(screen.getByLabelText('Order total').textContent).toBe('$30.99');
  });
});
describe('The checkout recovery offer takes $3 off the complete bundle', () => {
  it('A buyer accepts the recovery offer and pays $27.99 for all packages', () => {
    render(<Page recovery />); fireEvent.click(screen.getByRole('button', { name: 'Get all three — $27.99' }));
    expect(screen.getByLabelText('Order total').textContent).toBe('$27.99');
  });
});