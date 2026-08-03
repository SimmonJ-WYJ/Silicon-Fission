import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CodeDemo } from './CodeDemo';

afterEach(cleanup);

describe('CodeDemo keyboard navigation', () => {
  it('uses a roving tab stop and moves selection with horizontal arrow keys', () => {
    render(<CodeDemo locale="en" />);
    const chat = screen.getByRole('tab', { name: 'OpenAI Chat' });
    const responses = screen.getByRole('tab', { name: 'Responses' });
    const claude = screen.getByRole('tab', { name: 'Claude' });

    expect(chat).toHaveAttribute('tabindex', '0');
    expect(responses).toHaveAttribute('tabindex', '-1');
    expect(claude).toHaveAttribute('tabindex', '-1');

    chat.focus();
    fireEvent.keyDown(chat, { key: 'ArrowRight' });
    expect(responses).toHaveFocus();
    expect(responses).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/POST \/v1\/responses/)).toBeVisible();

    fireEvent.keyDown(responses, { key: 'ArrowLeft' });
    expect(chat).toHaveFocus();

    fireEvent.keyDown(chat, { key: 'ArrowLeft' });
    expect(claude).toHaveFocus();
    expect(claude).toHaveAttribute('aria-selected', 'true');
  });

  it('moves to the first and last tabs with Home and End', () => {
    render(<CodeDemo locale="en" />);
    const chat = screen.getByRole('tab', { name: 'OpenAI Chat' });
    const responses = screen.getByRole('tab', { name: 'Responses' });
    const claude = screen.getByRole('tab', { name: 'Claude' });

    responses.focus();
    fireEvent.keyDown(responses, { key: 'End' });
    expect(claude).toHaveFocus();
    expect(claude).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(claude, { key: 'Home' });
    expect(chat).toHaveFocus();
    expect(chat).toHaveAttribute('tabindex', '0');
  });
});
