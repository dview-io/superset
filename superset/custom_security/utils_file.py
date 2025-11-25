def get_org_info(email):
    if "@" not in email:
        return "NA", "NA"
    domain = email.split("@")[1] or "NA"
    org_name = domain.split(".")[0] or "NA"
    return org_name
