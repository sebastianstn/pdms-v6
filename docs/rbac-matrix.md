# RBAC-Berechtigungsmatrix

| Ressource | Arzt | Pflege | Admin |
|-----------|------|--------|-------|
| Patienten lesen | ✅ | ✅ | ✅ |
| Patienten anlegen | ✅ | ❌ | ✅ |
| Patienten ändern | ✅ | ❌ | ✅ |
| Patienten löschen | ❌ | ❌ | ✅ |
| Vitaldaten lesen | ✅ | ✅ | ✅ |
| Vitaldaten erfassen | ✅ | ✅ | ❌ |
| Verordnungen | ✅ | ❌ (lesen) | ❌ |
| Pflege-Doku | ✅ (lesen) | ✅ | ❌ |
| Audit-Log | ❌ | ❌ | ✅ |
| Benutzerverwaltung | ❌ | ❌ | ✅ |
