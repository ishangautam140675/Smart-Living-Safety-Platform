package com.smartliving.module1authentication.users.repository;

import com.smartliving.module1authentication.users.model.Role;
import com.smartliving.module1authentication.users.model.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleType name);
}
