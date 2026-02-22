import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import About from './About';
import axios from 'axios';


jest.mock('axios');

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()])
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div>
        <div data-testid="layout-title">{title}</div>
        {children}
      </div>
    );
  };
});


jest.mock('react-icons/bi', () => ({
  BiMailSend: () => <span data-testid="mail-icon">📧</span>,
  BiPhoneCall: () => <span data-testid="phone-icon">📞</span>,
  BiSupport: () => <span data-testid="support-icon">📞</span>
}));

      
describe('About Page Component', () => {

    it("test if about page renders correctly", () => {

    axios.post.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({ data: { categories: [] } });

    render(
    <MemoryRouter>
      <About />
    </MemoryRouter>
  );

     expect(screen.getByText(/Add text/)).toBeInTheDocument();
   




    })

})