import json
import datetime

def generate_master_hierarchy():
    """
    Generates a master hierarchy JSON file from categories, assemblies, and parts data.
    """
    try:
        # 1. Load Data
        with open('resources/categories.json', 'r') as f:
            categories_data = json.load(f)
        with open('resources/assemblies.json', 'r') as f:
            assemblies_data = json.load(f)
        with open('resources/parts.json', 'r') as f:
            parts_data = json.load(f)

    except FileNotFoundError as e:
        print(f"Error: Input file not found - {e.filename}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from file - {e.doc} at position {e.pos}")
        return

    # 2. Initialize Hierarchy
    output_hierarchy = {
        "metadata": {
            "generation_timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "description": "Master hierarchy of categories, subcategories, assemblies, and parts."
        },
        "hierarchy": {}
    }

    # Initialize hierarchy structure
    output_hierarchy["hierarchy"] = {}

    # 3. Process Categories
    # Assuming actual categories are under a "categories" key in categories.json
    actual_categories = categories_data.get("categories")
    if not actual_categories or not isinstance(actual_categories, dict):
        print(f"Error: 'categories' key not found or not a dictionary in categories.json. Found keys: {list(categories_data.keys())}")
        return

    for category_id, category_details in actual_categories.items():
        try:
            category_name = category_details["name"]
            category_description = category_details["description"]
        except KeyError as e:
            print(f"Warning: Skipping category '{category_id}' due to missing key: {e}")
            continue

        output_hierarchy["hierarchy"][category_id] = {
            "name": category_name,
            "description": category_description,
            "subcategories": {}
        }

        # 4. Process Subcategories
        if "subcategories" in category_details:
            for subcategory_id, subcategory_details in category_details["subcategories"].items():
                try:
                    subcategory_name = subcategory_details["name"]
                    subcategory_description = subcategory_details["description"]
                except KeyError as e:
                    print(f"Warning: Skipping subcategory '{subcategory_id}' in category '{category_id}' due to missing key: {e}")
                    continue

                output_hierarchy["hierarchy"][category_id]["subcategories"][subcategory_id] = {
                    "name": subcategory_name,
                    "description": subcategory_description,
                    "assemblies": []
                }

                # 5. Process Assemblies
                if "assembly_refs" in subcategory_details:
                    for assembly_id in subcategory_details["assembly_refs"]:
                        if assembly_id not in assemblies_data:
                            print(f"Warning: Assembly ID '{assembly_id}' found in subcategory '{subcategory_id}' but not in assemblies.json. Skipping.")
                            continue

                        assembly_info = assemblies_data[assembly_id]
                        try:
                            assembly_name = assembly_info["name"]
                            assembly_type = assembly_info["type"]
                            assembly_status = assembly_info["status"]
                        except KeyError as e:
                            print(f"Warning: Skipping assembly '{assembly_id}' in subcategory '{subcategory_id}' due to missing key: {e}")
                            continue

                        current_assembly_obj = {
                            "id": assembly_id,
                            "name": assembly_name,
                            "type": assembly_type,
                            "can_order": assembly_info.get("can_order"),
                            "is_kit": assembly_info.get("is_kit"),
                            "status": assembly_status,
                            "components": []
                        }

                        # 6. Process Components (Parts)
                        if "components" in assembly_info:
                            for component in assembly_info["components"]:
                                try:
                                    part_id = component["part_id"]
                                    quantity = component["quantity"]
                                except KeyError as e:
                                    print(f"Warning: Skipping component in assembly '{assembly_id}' due to missing key: {e} in component data: {component}")
                                    continue

                                if part_id in parts_data:
                                    part_details = parts_data[part_id]
                                    try:
                                        component_obj = {
                                            "part_id": part_id,
                                            "name": part_details["name"],
                                            "manufacturer_part_number": part_details["manufacturer_part_number"],
                                            "manufacturer_info": part_details["manufacturer_info"],
                                            "type": part_details["type"],
                                            "status": part_details["status"],
                                            "quantity": quantity
                                        }
                                    except KeyError as e:
                                        print(f"Warning: Skipping part '{part_id}' in assembly '{assembly_id}' due to missing key: {e} in part data: {part_details}")
                                        component_obj = {
                                            "part_id": part_id,
                                            "quantity": quantity,
                                            "error": f"Part details incomplete (missing key: {e})"
                                        }
                                else:
                                    component_obj = {
                                        "part_id": part_id,
                                        "quantity": quantity,
                                        "error": "Part details not found"
                                    }
                                current_assembly_obj["components"].append(component_obj)

                        output_hierarchy["hierarchy"][category_id]["subcategories"][subcategory_id]["assemblies"].append(current_assembly_obj)

    # 7. Write Output
    try:
        with open('resources/master_hierarchy.json', 'w') as f:
            json.dump(output_hierarchy, f, indent=2)
        print("Successfully generated resources/master_hierarchy.json")
    except IOError as e:
        print(f"Error: Could not write output file - {e}")
        return # Added return to stop execution if file cannot be written

if __name__ == "__main__":
    generate_master_hierarchy()
