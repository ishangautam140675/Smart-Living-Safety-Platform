package com.smartliving.module1authentication.service;

import com.smartliving.module1authentication.dto.AuthResponse;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module1authentication.dto.RegisterRequest;
import com.smartliving.module1authentication.dto.UserProfileResponse;
import com.smartliving.module1authentication.security.JwtTokenProvider;
import com.smartliving.module1authentication.security.UserPrincipal;
import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module1authentication.users.model.Role;
import com.smartliving.module1authentication.users.model.RoleType;
import com.smartliving.module1authentication.users.model.User;
import com.smartliving.module1authentication.users.repository.RoleRepository;
import com.smartliving.module1authentication.users.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return new AuthResponse(
                jwt,
                userPrincipal.getId(),
                userPrincipal.getEmail(),
                userPrincipal.getFullName(),
                roles
        );
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AppException("Email is already registered: " + normalizedEmail);
        }

        User user = new User(
                request.getFullName().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                request.getPhone()
        );

        RoleType targetRoleType = request.getRole() != null ? request.getRole() : RoleType.ROLE_RESIDENT;
        Role role = roleRepository.findByName(targetRoleType)
                .orElseGet(() -> roleRepository.save(new Role(targetRoleType)));

        user.setRoles(Collections.singleton(role));
        User savedUser = userRepository.save(user);

        String jwt = tokenProvider.generateTokenFromUsername(savedUser.getEmail());

        List<String> roles = savedUser.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toList());

        return new AuthResponse(
                jwt,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                roles
        );
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                roles
        );
    }
}
