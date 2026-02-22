// Gabriel Seethor, A0257008H 
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Contact from './Contact';
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

//Used DeepSeekV3.2 to help me mock Layout Component as it was giving issues.
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

      
describe('Contact Page Component', () => {

    it("test if contact page renders correctly", () => {

    axios.post.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({ data: { categories: [] } });

    render(
    <MemoryRouter>
      <Contact />
    </MemoryRouter>
  );

     expect(screen.getByText(/CONTACT US/)).toBeInTheDocument();
     expect(screen.getByText(/For any query or info about product, feel free to call anytime. We are available 24X7./)).toBeInTheDocument();
     expect(screen.getByText(/www.help@ecommerceapp.com/)).toBeInTheDocument();
     expect(screen.getByText(/012-3456789/)).toBeInTheDocument();
     expect(screen.getByText(/1800-0000-0000 \(toll free\)/)).toBeInTheDocument();




    })

})