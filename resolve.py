import os

def fix_search_input():
    path = "client/src/components/Form/SearchInput.test.js"
    with open(path, "r") as f:
        text = f.read()
    
    # top conflict:
    # keep HEAD
    text = text.replace("""<<<<<<< HEAD
// Antony Swami Alfred Ben, A0253016R
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import SearchInput from "./SearchInput";

// Antony Swami Alfred Ben, A0253016R — mock dependencies
=======
import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import SearchInput from "./SearchInput";

// ─── Module Mocks ────────────────────────────────────────────────────────────

>>>>>>> origin/main""", """// Antony Swami Alfred Ben, A0253016R
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import SearchInput from "./SearchInput";

// Antony Swami Alfred Ben, A0253016R — mock dependencies""")

    # second conflict:
    # I will replace the split between HEAD and origin/main
    # Actually, I'll just write a custom script using string splitting.
    
    parts = text.split("<<<<<<< HEAD")
    if len(parts) > 1:
        bottom = parts[1]
        head_part = bottom.split("=======")[0]
        main_part = bottom.split("=======")[1].split(">>>>>>> origin/main")[0]
        
        # main_part starts with:
        #   ...jest.requireActual("react-router-dom"),
        #   useNavigate: () => mockNavigate,
        # }));
        # We can remove these 3 lines to avoid syntax error since HEAD already closed it.
        main_part_clean = "\n".join(main_part.strip().split("\n")[4:])
        
        resolved = head_part + "\n" + main_part_clean
        text = parts[0] + resolved + bottom.split(">>>>>>> origin/main")[1]

    with open(path, "w") as f:
        f.write(text)

def fix_private():
    path = "client/src/components/Routes/Private.test.js"
    with open(path, "r") as f:
        text = f.read()
    
    parts = text.split("<<<<<<< HEAD\n")
    if len(parts) > 1:
        head_part = parts[1].split("=======\n")[0]
        main_part = parts[1].split("=======\n")[1].split(">>>>>>> origin/main\n")[0]
        
        # main part has duplicate imports. Let's just extract the tests from main.
        # we can just use regex to find describe block in main_part
        import re
        main_tests = re.search(r'describe\("PrivateRoute", \(\) => \{(.*)\}\);', main_part, re.DOTALL)
        if main_tests:
            # append main_tests inside HEAD's describe?
            # Or just append the whole describe block
            describe_main = "describe('PrivateRoute main', () => {" + main_tests.group(1) + "});"
            resolved = head_part + "\n" + describe_main
            text = parts[0] + resolved + parts[1].split(">>>>>>> origin/main\n")[1]
            with open(path, "w") as f:
                f.write(text)

def fix_usermenu():
    path = "client/src/components/UserMenu.test.js"
    with open(path, "r") as f:
        text = f.read()
        
    parts = text.split("<<<<<<< HEAD\n")
    if len(parts) > 1:
        head_part = parts[1].split("=======\n")[0]
        main_part = parts[1].split("=======\n")[1].split(">>>>>>> origin/main\n")[0]
        
        import re
        main_tests = re.search(r'describe\("UserMenu", \(\) => \{(.*)\}\);', main_part, re.DOTALL)
        if main_tests:
            describe_main = "describe('UserMenu main', () => {" + main_tests.group(1) + "});"
            resolved = head_part + "\n" + describe_main
            text = parts[0] + resolved + parts[1].split(">>>>>>> origin/main\n")[1]
            with open(path, "w") as f:
                f.write(text)

def fix_usermodel():
    path = "models/userModel.test.js"
    with open(path, "r") as f:
        text = f.read()
        
    parts = text.split("<<<<<<< HEAD\n")
    if len(parts) > 1:
        head_part = parts[1].split("=======\n")[0]
        main_part = parts[1].split("=======\n")[1].split(">>>>>>> origin/main\n")[0]
        
        # main_part uses `import User from "./userModel.js";`
        # we can just replace that with `const User = userModel;`
        main_part_clean = main_part.replace('import User from "./userModel.js";', 'const User = userModel;')
        resolved = head_part + "\n" + main_part_clean
        text = parts[0] + resolved + parts[1].split(">>>>>>> origin/main\n")[1]
        with open(path, "w") as f:
            f.write(text)

def fix_dashboard():
    path = "client/src/pages/user/Dashboard.test.js"
    with open(path, "r") as f:
        text = f.read()
        
    parts = text.split("<<<<<<< HEAD\n")
    if len(parts) > 1:
        head_part = parts[1].split("=======\n")[0]
        main_part = parts[1].split("=======\n")[1].split(">>>>>>> origin/main\n")[0]
        
        # main_part has describe("User Dashboard", ...)
        import re
        main_tests = re.search(r'describe\("User Dashboard", \(\) => \{(.*)\}\);', main_part, re.DOTALL)
        if main_tests:
            describe_main = "describe('User Dashboard main', () => {" + main_tests.group(1) + "});"
            resolved = head_part + "\n" + describe_main
            text = parts[0] + resolved + parts[1].split(">>>>>>> origin/main\n")[1]
            with open(path, "w") as f:
                f.write(text)

if __name__ == "__main__":
    fix_search_input()
    fix_private()
    fix_usermenu()
    fix_usermodel()
    fix_dashboard()
    print("Resolved 5 files")
